import { Logger } from '@nestjs/common';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { createHash } from 'crypto';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';
import { ImportTrajectoireSnbc3Error } from './import-trajectoire-snbc3.errors';

export const SNBC3_PARQUET_FILE = 'resultats_territorialises.parquet';
export const SNBC3_MANIFEST_FILE = 'manifest.json';

/** `main.py release` assemble chaque paquet dans `releases/V<version>/`. */
export const getSnbc3ReleasePath = (version: string) => `V${version}`;

/** Tag GitHub de la release d'une version. */
export const getSnbc3ReleaseTag = (version: string) => `v${version}`;

const manifestEntrySchema = z.object({
  nom: z.string(),
  octets: z.number(),
  sha256: z.string(),
});

export type Snbc3ManifestEntry = z.infer<typeof manifestEntrySchema>;

/** Contrat de `manifest.json`, écrit par `snbc3` (noms de champs inclus). */
const manifestSchema = z.object({
  version: z.string(),
  /**
   * Date de publication du paquet : c'est le millésime de la livraison. Avec
   * son fuseau, pour ne pas dépendre de celui du serveur.
   */
  date_publication: z.iso.datetime({ offset: true }),
  code: z.object({
    commit: z.string().regex(/^[0-9a-f]{40}$/),
    modifications_non_commitees: z.boolean().optional(),
  }),
  fichiers: z.array(manifestEntrySchema),
});

export type Snbc3Release = {
  version: string;
  /** SHA complet du commit `snbc3` noté dans le manifeste. */
  commit: string;
  /** Date ISO (UTC) de publication de la release : millésime de la livraison. */
  datePublication: string;
  /**
   * sha256 du parquet, vérifié : désigne les valeurs importées mieux que le
   * commit, une release pouvant être republiée depuis le même commit.
   */
  parquetSha256: string;
  /** `manifest.json` tel que publié, copié dans le bucket par l'import. */
  manifest: Uint8Array;
  parquet: Uint8Array;
  workbook: { name: string; content: Uint8Array };
  /** PDF de méthodologie de la release, servi par la page Trajectoire. */
  methodologie: { name: string; content: Uint8Array };
};

type ReadResult<T> = Result<T, ImportTrajectoireSnbc3Error>;

/** Fichiers d'une release ouverte : `success(null)` pour un fichier absent. */
export type Snbc3ReleaseSource = {
  readManifest(): Promise<ReadResult<Uint8Array | null>>;
  /** Fichier désigné par son entrée de manifeste. */
  readFile(entry: Snbc3ManifestEntry): Promise<ReadResult<Uint8Array | null>>;
};

/**
 * Lit une release publiée par `snbc3` : son manifeste, le parquet des
 * résultats, le classeur standalone et le PDF de méthodologie, vérifiés
 * contre les tailles et empreintes du manifeste. Le commit et la date de
 * publication sont ceux du manifeste.
 *
 * Injectable sous ce jeton abstrait : les releases GitHub en prod, un dossier
 * de paquets en dev, une release en mémoire dans les tests.
 */
export abstract class Snbc3ArtifactReader {
  protected readonly logger = new Logger(Snbc3ArtifactReader.name);

  /** `success(null)` si la release n'existe pas. */
  protected abstract openRelease(
    version: string
  ): Promise<ReadResult<Snbc3ReleaseSource | null>>;

  async readRelease(version: string): Promise<ReadResult<Snbc3Release>> {
    const opened = await this.openRelease(version);
    if (!opened.success) return opened;
    if (!opened.data) {
      this.logger.error(`La release ${version} est introuvable`);
      return failure('SNBC3_ARTIFACT_NOT_FOUND');
    }
    const source = opened.data;

    const manifestFile = await source.readManifest();
    if (!manifestFile.success) return manifestFile;
    if (!manifestFile.data) {
      this.logger.error(
        `${SNBC3_MANIFEST_FILE} est introuvable dans la release ${version}`
      );
      return failure('SNBC3_ARTIFACT_NOT_FOUND');
    }
    const manifest = manifestSchema.safeParse(
      safeJsonParse(Buffer.from(manifestFile.data).toString('utf-8'))
    );
    if (!manifest.success || manifest.data.version !== version) {
      this.logger.error(
        `Manifeste de la release ${version} invalide : ${
          manifest.success
            ? `version ${manifest.data.version}`
            : manifest.error.message
        }`
      );
      return failure('SNBC3_ARTIFACT_INVALID');
    }
    const { code, date_publication: datePublication } = manifest.data;
    if (code.modifications_non_commitees) {
      this.logger.warn(
        `La release ${version} a été assemblée avec des modifications non commitées (commit ${code.commit})`
      );
    }

    const parquetEntry = manifest.data.fichiers.find(
      ({ nom }) => nom === SNBC3_PARQUET_FILE
    );
    const workbookEntry = manifest.data.fichiers.find(({ nom }) =>
      nom.endsWith('.xlsx')
    );
    const methodologieEntry = manifest.data.fichiers.find(({ nom }) =>
      nom.toLowerCase().endsWith('.pdf')
    );
    if (!parquetEntry || !workbookEntry || !methodologieEntry) {
      this.logger.error(
        `La release ${version} doit contenir le parquet, le classeur standalone et le PDF de méthodologie`
      );
      return failure('SNBC3_ARTIFACT_NOT_FOUND');
    }

    const contents: Uint8Array[] = [];
    for (const entry of [parquetEntry, workbookEntry, methodologieEntry]) {
      const file = await source.readFile(entry);
      if (!file.success) return file;
      if (!file.data) {
        this.logger.error(
          `${entry.nom} est introuvable dans la release ${version}`
        );
        return failure('SNBC3_ARTIFACT_NOT_FOUND');
      }
      const sha256 = createHash('sha256').update(file.data).digest('hex');
      if (file.data.byteLength !== entry.octets || sha256 !== entry.sha256) {
        this.logger.error(
          `${entry.nom} (release ${version}) ne correspond pas au manifeste : ${file.data.byteLength} octets, sha256 ${sha256}`
        );
        return failure('SNBC3_ARTIFACT_INVALID');
      }
      contents.push(file.data);
    }

    return success({
      version,
      commit: code.commit,
      datePublication: new Date(datePublication).toISOString(),
      parquetSha256: parquetEntry.sha256,
      manifest: manifestFile.data,
      parquet: contents[0],
      workbook: { name: workbookEntry.nom, content: contents[1] },
      methodologie: { name: methodologieEntry.nom, content: contents[2] },
    });
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

const GITHUB_API_URL = 'https://api.github.com';
/** Version courante de l'API REST GitHub */
const GITHUB_API_VERSION = '2026-03-10';
/** GitHub refuse les requêtes sans `User-Agent`. */
const GITHUB_USER_AGENT = 'territoires-en-transitions';

/**
 * Réponse de `GET /repos/{owner}/{repo}/releases/tags/{tag}` : les assets
 * portent l'empreinte sha256 de leur contenu (`digest`), ce qui permet de les
 * rattacher au manifeste malgré le renommage de GitHub (espaces et accents).
 * `url` est l'adresse de l'asset dans l'API, téléchargeable avec le jeton.
 */
const githubReleaseSchema = z.object({
  assets: z.array(
    z.object({
      name: z.string(),
      size: z.number(),
      digest: z.string().nullable().optional(),
      url: z.url(),
    })
  ),
});

type GithubAsset = z.infer<typeof githubReleaseSchema>['assets'][number];

/**
 * Lecture des releases GitHub du dépôt public qui publie la trajectoire SNBC 3
 * territorialisée (ADR 0023, `TRAJECTOIRE_SNBC3_REPOSITORY_URL`) : les
 * fichiers du paquet sont joints à la release taguée `v<version>`. Le jeton
 * est facultatif : il élargit le quota de l'API (60 requêtes par heure et par
 * IP sans jeton) et permet de lire un dépôt privé, les assets étant
 * téléchargés par l'API.
 */
export class GithubSnbc3ArtifactReader extends Snbc3ArtifactReader {
  /** `GET /repos/{owner}/{repo}` */
  private readonly api: string;
  private readonly token: string | undefined;

  constructor({
    repositoryUrl,
    token,
  }: {
    repositoryUrl: string;
    token: string | undefined;
  }) {
    super();
    this.token = token;
    // URL du dépôt acceptée avec ou sans le suffixe `.git`
    const repository = new URL(repositoryUrl).pathname
      .replace(/^\/|\/$/g, '')
      .replace(/\.git$/, '');
    this.api = `${GITHUB_API_URL}/repos/${repository}`;
  }

  protected async openRelease(
    version: string
  ): Promise<ReadResult<Snbc3ReleaseSource | null>> {
    const tag = getSnbc3ReleaseTag(version);
    const response = await this.get(
      `${this.api}/releases/tags/${encodeURIComponent(tag)}`,
      {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': GITHUB_API_VERSION,
      },
      (body) => body.json()
    );
    if (!response.success) return response;
    if (response.data === null) return success(null);
    const release = githubReleaseSchema.safeParse(response.data);
    if (!release.success) {
      this.logger.error(
        `Release ${tag} : réponse de GitHub inattendue (${release.error.message})`
      );
      return failure('SNBC3_REPOSITORY_UNREACHABLE');
    }
    const { assets } = release.data;
    // Sans empreinte, un asset ne peut pas être rattaché au manifeste : GitHub
    // en calcule une pour tout asset déposé, son absence est une anomalie.
    const withoutDigest = assets.filter(({ digest }) => !digest);
    if (withoutDigest.length > 0) {
      this.logger.error(
        `Release ${tag} refusée : assets sans empreinte sha256 (${withoutDigest
          .map(({ name }) => name)
          .join(', ')})`
      );
      return failure('SNBC3_ARTIFACT_INVALID');
    }

    // Par l'API plutôt que `browser_download_url`, qui ignore le jeton : la
    // réponse redirige vers un stockage signé, sans en-tête `Authorization`.
    const download = async (asset: GithubAsset) => {
      const file = await this.get(
        asset.url,
        {
          Accept: 'application/octet-stream',
          'X-GitHub-Api-Version': GITHUB_API_VERSION,
        },
        async (body) => new Uint8Array(await body.arrayBuffer())
      );
      if (!file.success) return file;
      if (file.data === null) {
        this.logger.error(`L'asset ${asset.name} de ${tag} a disparu`);
        return failure('SNBC3_REPOSITORY_UNREACHABLE' as const);
      }
      return success(file.data);
    };

    return success({
      readManifest: async () => {
        const asset = assets.find(({ name }) => name === SNBC3_MANIFEST_FILE);
        return asset ? download(asset) : success(null);
      },
      readFile: async (entry) => {
        const asset = assets.find(
          ({ digest }) => digest === `sha256:${entry.sha256}`
        );
        if (!asset) {
          this.logger.error(
            `${entry.nom} (sha256 ${
              entry.sha256
            }) sans asset dans la release ${tag} : ${
              assets
                .map(({ name, digest }) => `${name} ${digest}`)
                .join(', ') || 'aucun asset'
            }`
          );
          return success(null);
        }
        // Inutile de télécharger un asset dont GitHub annonce une autre taille.
        if (asset.size !== entry.octets) {
          this.logger.error(
            `${entry.nom} (release ${tag}) : l'asset ${asset.name} fait ${asset.size} octets, le manifeste en annonce ${entry.octets}`
          );
          return failure('SNBC3_ARTIFACT_INVALID' as const);
        }
        return download(asset);
      },
    });
  }

  /**
   * `success(null)` sur un 404. Le corps est lu dans le `try` : une coupure ou
   * le timeout pendant le téléchargement donne `SNBC3_REPOSITORY_UNREACHABLE`.
   */
  private async get<T>(
    url: string,
    headers: Record<string, string>,
    readBody: (response: globalThis.Response) => Promise<T>
  ): Promise<ReadResult<T | null>> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': GITHUB_USER_AGENT,
          ...headers,
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
        signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
      });
      if (response.status === 404) return success(null);
      if (!response.ok) {
        this.logger.error(
          `GitHub a répondu ${response.status} sur ${url}${
            response.headers.get('x-ratelimit-remaining') === '0'
              ? ' (quota de l’API épuisé)'
              : ''
          }`
        );
        return failure('SNBC3_REPOSITORY_UNREACHABLE');
      }
      return success(await readBody(response));
    } catch (error) {
      this.logger.error(
        `Échec de la lecture de ${url} : ${getErrorMessage(error)}`
      );
      return failure('SNBC3_REPOSITORY_UNREACHABLE');
    }
  }
}

const isFileNotFoundError = (error: unknown) =>
  (error as { code?: string } | null)?.code === 'ENOENT';

/**
 * Lecture dans un dossier de paquets de publication, pour le dev
 * (`TRAJECTOIRE_SNBC3_LOCAL_RELEASES`) : le `releases/` d'un clone de `snbc3`
 * après `main.py release`, ou les assets d'une release GitHub téléchargés
 * dans `V<version>/` sous leurs noms du manifeste.
 */
export class LocalSnbc3ArtifactReader extends Snbc3ArtifactReader {
  constructor(private readonly releasesPath: string) {
    super();
  }

  protected async openRelease(
    version: string
  ): Promise<ReadResult<Snbc3ReleaseSource | null>> {
    const root = await stat(this.releasesPath).catch((error: unknown) => {
      this.logger.error(
        `Dossier des releases ${
          this.releasesPath
        } illisible : ${getErrorMessage(error)}`
      );
      return null;
    });
    if (!root?.isDirectory()) return failure('SNBC3_REPOSITORY_UNREACHABLE');

    const releasePath = join(this.releasesPath, getSnbc3ReleasePath(version));
    const release = await stat(releasePath).catch(() => null);
    if (!release?.isDirectory()) return success(null);

    const read = async (
      name: string
    ): Promise<ReadResult<Uint8Array | null>> => {
      try {
        const content = await readFile(join(releasePath, name));
        // Vue sur le Buffer, sans copie (~40 Mo pour le parquet).
        return success(
          new Uint8Array(content.buffer, content.byteOffset, content.byteLength)
        );
      } catch (error) {
        if (isFileNotFoundError(error)) return success(null);
        this.logger.error(
          `Lecture de ${name} dans ${releasePath} impossible : ${getErrorMessage(
            error
          )}`
        );
        return failure('SNBC3_REPOSITORY_UNREACHABLE');
      }
    };
    return success({
      readManifest: () => read(SNBC3_MANIFEST_FILE),
      readFile: ({ nom }) => read(nom),
    });
  }
}
