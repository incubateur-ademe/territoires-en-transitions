import { Logger } from '@nestjs/common';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { execFile } from 'child_process';
import { createHash } from 'crypto';
import { promisify } from 'util';
import { z } from 'zod';
import { ImportTrajectoireSnbc3Error } from './import-trajectoire-snbc3.errors';

export const SNBC3_PARQUET_FILE = 'resultats_territorialises.parquet';
const SNBC3_MANIFEST_FILE = 'manifest.json';

/** `main.py release` assemble chaque paquet dans `releases/V<version>/`. */
export const getSnbc3ReleasePath = (version: string) => `releases/V${version}`;

/** Contrat de `manifest.json`, écrit par `snbc3` (noms de champs inclus). */
const manifestSchema = z.object({
  version: z.string(),
  fichiers: z.array(
    z.object({ nom: z.string(), octets: z.number(), sha256: z.string() })
  ),
});

export type Snbc3Commit = {
  sha: string;
  /** Date ISO du commit : c'est le millésime de la livraison. */
  date: string;
};

export type Snbc3Release = Snbc3Commit & {
  version: string;
  /** `manifest.json` tel que publié, copié dans le bucket par l'import. */
  manifest: Uint8Array;
  parquet: Uint8Array;
  workbook: { name: string; content: Uint8Array };
};

type ReadResult<T> = Result<T, ImportTrajectoireSnbc3Error>;

/**
 * Lit une release publiée par commit dans le dépôt `snbc3` : son manifeste, le
 * parquet des résultats et le classeur standalone, vérifiés contre les tailles
 * et empreintes du manifeste.
 *
 * Injectable sous ce jeton abstrait : le dépôt GitLab en prod, un clone local en
 * dev, un dépôt en mémoire dans les tests.
 */
export abstract class Snbc3ArtifactReader {
  protected readonly logger = new Logger(Snbc3ArtifactReader.name);

  protected abstract resolveCommit(
    commit: string
  ): Promise<ReadResult<Snbc3Commit>>;

  /** `success(null)` si le fichier n'existe pas dans le commit. */
  protected abstract readFile(
    sha: string,
    path: string
  ): Promise<ReadResult<Uint8Array | null>>;

  async readRelease(
    commit: string,
    version: string
  ): Promise<ReadResult<Snbc3Release>> {
    const resolved = await this.resolveCommit(commit);
    if (!resolved.success) return resolved;
    const { sha, date } = resolved.data;
    const releasePath = getSnbc3ReleasePath(version);

    const manifestFile = await this.readRequiredFile(
      sha,
      `${releasePath}/${SNBC3_MANIFEST_FILE}`
    );
    if (!manifestFile.success) return manifestFile;
    const manifest = manifestSchema.safeParse(
      safeJsonParse(Buffer.from(manifestFile.data).toString('utf-8'))
    );
    if (!manifest.success || manifest.data.version !== version) {
      this.logger.error(
        `Manifeste de la release ${version} (${sha}) invalide : ${
          manifest.success
            ? `version ${manifest.data.version}`
            : manifest.error.message
        }`
      );
      return failure('SNBC3_ARTIFACT_INVALID');
    }

    const parquetEntry = manifest.data.fichiers.find(
      ({ nom }) => nom === SNBC3_PARQUET_FILE
    );
    const workbookEntry = manifest.data.fichiers.find(({ nom }) =>
      nom.endsWith('.xlsx')
    );
    if (!parquetEntry || !workbookEntry) {
      this.logger.error(
        `La release ${version} (${sha}) doit contenir le parquet et le classeur standalone`
      );
      return failure('SNBC3_ARTIFACT_NOT_FOUND');
    }

    const contents: Uint8Array[] = [];
    for (const entry of [parquetEntry, workbookEntry]) {
      const file = await this.readRequiredFile(
        sha,
        `${releasePath}/${entry.nom}`
      );
      if (!file.success) return file;
      const sha256 = createHash('sha256').update(file.data).digest('hex');
      if (file.data.byteLength !== entry.octets || sha256 !== entry.sha256) {
        this.logger.error(
          `${entry.nom} (${sha}) ne correspond pas au manifeste : ${file.data.byteLength} octets, sha256 ${sha256}`
        );
        return failure('SNBC3_ARTIFACT_INVALID');
      }
      contents.push(file.data);
    }

    return success({
      sha,
      date,
      version,
      manifest: manifestFile.data,
      parquet: contents[0],
      workbook: { name: workbookEntry.nom, content: contents[1] },
    });
  }

  private async readRequiredFile(
    sha: string,
    path: string
  ): Promise<ReadResult<Uint8Array>> {
    const file = await this.readFile(sha, path);
    if (!file.success) return file;
    if (!file.data) {
      this.logger.error(`${path} est introuvable dans le commit ${sha}`);
      return failure('SNBC3_ARTIFACT_NOT_FOUND');
    }
    return success(file.data);
  }
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** Délai pour un fichier de la release : le parquet pèse une quarantaine de Mo. */
const DOWNLOAD_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Lecture par l'API GitLab du dépôt autonome qui publie la trajectoire SNBC 3
 * territorialisée (ADR 0023, `TRAJECTOIRE_SNBC3_REPOSITORY_URL`). Le dépôt est
 * privé : le jeton (`read_repository`, ou `read_api`) est requis en prod.
 */
export class GitlabSnbc3ArtifactReader extends Snbc3ArtifactReader {
  /** `null` sans URL de dépôt configurée : toute lecture échoue. */
  private readonly api: string | null;
  private readonly token: string | undefined;

  constructor({
    repositoryUrl,
    token,
  }: {
    repositoryUrl: string | undefined;
    token: string | undefined;
  }) {
    super();
    this.token = token;
    if (!repositoryUrl) {
      this.api = null;
      return;
    }
    const url = new URL(repositoryUrl);
    // URL de clone acceptée : `https://gitlab…/groupe/snbc3.git`.
    this.api = `${url.origin}/api/v4/projects/${encodeURIComponent(
      url.pathname.replace(/^\/|\/$/g, '').replace(/\.git$/, '')
    )}`;
  }

  protected async resolveCommit(
    commit: string
  ): Promise<ReadResult<Snbc3Commit>> {
    const response = await this.get(
      `/repository/commits/${encodeURIComponent(commit)}`,
      (body) => body.json()
    );
    if (!response.success) return response;
    if (response.data === null) return failure('SNBC3_ARTIFACT_NOT_FOUND');
    const parsed = z
      .object({ id: z.string(), committed_date: z.string() })
      .safeParse(response.data);
    if (!parsed.success) return failure('SNBC3_REPOSITORY_UNREACHABLE');
    return success({
      sha: parsed.data.id,
      date: new Date(parsed.data.committed_date).toISOString(),
    });
  }

  protected async readFile(
    sha: string,
    path: string
  ): Promise<ReadResult<Uint8Array | null>> {
    const response = await this.get(
      `/repository/files/${encodeURIComponent(path)}/raw?ref=${sha}`,
      async (body) => new Uint8Array(await body.arrayBuffer())
    );
    if (!response.success) return response;
    return success(response.data);
  }

  /**
   * `success(null)` sur un 404. Le corps est lu dans le `try` : une coupure ou
   * le timeout pendant le téléchargement donne `SNBC3_REPOSITORY_UNREACHABLE`.
   */
  private async get<T>(
    path: string,
    readBody: (response: globalThis.Response) => Promise<T>
  ): Promise<ReadResult<T | null>> {
    if (!this.api) {
      this.logger.error(
        'TRAJECTOIRE_SNBC3_REPOSITORY_URL n’est pas configurée : le dépôt snbc3 est inconnu'
      );
      return failure('SNBC3_REPOSITORY_UNREACHABLE');
    }
    try {
      const response = await fetch(`${this.api}${path}`, {
        headers: this.token ? { 'PRIVATE-TOKEN': this.token } : {},
        signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
      });
      if (response.status === 404) {
        // GitLab répond aussi 404 à un projet privé lu sans jeton.
        if (!this.token) return failure('SNBC3_REPOSITORY_UNREACHABLE');
        return success(null);
      }
      if (!response.ok) {
        this.logger.error(`GitLab a répondu ${response.status} sur ${path}`);
        return failure('SNBC3_REPOSITORY_UNREACHABLE');
      }
      return success(await readBody(response));
    } catch (error) {
      this.logger.error(
        `Échec de la lecture de ${path} : ${getErrorMessage(error)}`
      );
      return failure('SNBC3_REPOSITORY_UNREACHABLE');
    }
  }
}

const execFileAsync = promisify(execFile);

/** Messages de git en anglais, pour reconnaître ceux d'un objet absent. */
const GIT_ENV = { ...process.env, LC_ALL: 'C' };

/** Commit ou fichier absent du dépôt, d'après le message d'erreur de git. */
const GIT_NOT_FOUND_PATTERN =
  /does not exist in|exists on disk, but not in|invalid object name|unknown revision|bad revision|ambiguous argument/;

export const isGitNotFoundError = (error: unknown): boolean => {
  const stderr = (error as { stderr?: Buffer | string } | null)?.stderr;
  return GIT_NOT_FOUND_PATTERN.test(stderr?.toString() ?? '');
};

/** Lecture dans un clone local du dépôt, pour le dev (`TRAJECTOIRE_SNBC3_LOCAL_REPOSITORY`). */
export class LocalSnbc3ArtifactReader extends Snbc3ArtifactReader {
  constructor(private readonly repositoryPath: string) {
    super();
  }

  protected async resolveCommit(
    commit: string
  ): Promise<ReadResult<Snbc3Commit>> {
    try {
      const { stdout } = await execFileAsync(
        'git',
        [
          '-C',
          this.repositoryPath,
          'log',
          '-1',
          '--format=%H%n%cI',
          `${commit}^{commit}`,
          '--',
        ],
        { env: GIT_ENV }
      );
      const [sha, date] = stdout.trim().split('\n');
      return success({ sha, date: new Date(date).toISOString() });
    } catch (error) {
      if (isGitNotFoundError(error)) {
        this.logger.error(
          `Commit ${commit} introuvable dans ${this.repositoryPath}`
        );
        return failure('SNBC3_ARTIFACT_NOT_FOUND');
      }
      this.logger.error(
        `Lecture du commit ${commit} dans ${
          this.repositoryPath
        } impossible : ${getErrorMessage(error)}`
      );
      return failure('SNBC3_REPOSITORY_UNREACHABLE');
    }
  }

  /**
   * `success(null)` si git signale le fichier absent du commit ; toute autre
   * erreur (git introuvable, dépôt invalide, fichier trop gros…) est un échec.
   */
  protected async readFile(
    sha: string,
    path: string
  ): Promise<ReadResult<Uint8Array | null>> {
    try {
      const { stdout } = await execFileAsync(
        'git',
        ['-C', this.repositoryPath, 'show', `${sha}:${path}`],
        { encoding: 'buffer', maxBuffer: 512 * 1024 * 1024, env: GIT_ENV }
      );
      // Vue sur le Buffer, sans copie (~40 Mo pour le parquet).
      return success(
        new Uint8Array(stdout.buffer, stdout.byteOffset, stdout.byteLength)
      );
    } catch (error) {
      if (isGitNotFoundError(error)) return success(null);
      this.logger.error(
        `Lecture de ${path} (${sha}) dans ${
          this.repositoryPath
        } impossible : ${getErrorMessage(error)}`
      );
      return failure('SNBC3_REPOSITORY_UNREACHABLE');
    }
  }
}
