import { success } from '@tet/backend/utils/result.type';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  getSnbc3ReleasePath,
  GithubSnbc3ArtifactReader,
  LocalSnbc3ArtifactReader,
  Snbc3ArtifactReader,
  Snbc3ManifestEntry,
  Snbc3ReleaseSource,
  SNBC3_MANIFEST_FILE,
  SNBC3_PARQUET_FILE,
} from './snbc3-artifact.reader';
import { buildSnbc3Manifest, sha256Hex } from './snbc3-release.test-fixture';

const VERSION = '2.1';
const COMMIT = 'a'.repeat(40);
const DATE_PUBLICATION = '2026-11-08T10:00:00+01:00';
const WORKBOOK = 'standalone.xlsx';
const METHODOLOGIE = 'methodologie.pdf';

const toBytes = (value: unknown) =>
  new Uint8Array(Buffer.from(JSON.stringify(value)));

/** Release en mémoire dont le manifeste peut mentir sur les fichiers. */
class MemorySnbc3ArtifactReader extends Snbc3ArtifactReader {
  readonly files = new Map<string, Uint8Array>();

  protected async openRelease(version: string) {
    if (version !== VERSION) return success(null);
    const source: Snbc3ReleaseSource = {
      readManifest: async () =>
        success(this.files.get(SNBC3_MANIFEST_FILE) ?? null),
      readFile: async ({ nom }) => success(this.files.get(nom) ?? null),
    };
    return success(source);
  }

  publish({
    parquet,
    declaredParquet = {
      octets: parquet.byteLength,
      sha256: sha256Hex(parquet),
    },
    withMethodologie = true,
    manifest: overrideManifest,
  }: {
    parquet: Uint8Array;
    declaredParquet?: { octets: number; sha256: string };
    withMethodologie?: boolean;
    /** Remplace le manifeste construit. */
    manifest?: (manifest: Record<string, unknown>) => Record<string, unknown>;
  }) {
    const workbook = new Uint8Array([1, 2, 3]);
    const methodologie = new Uint8Array([4, 5, 6]);
    const built = buildSnbc3Manifest({
      version: VERSION,
      commit: COMMIT,
      datePublication: DATE_PUBLICATION,
      fichiers: [
        [SNBC3_PARQUET_FILE, parquet],
        [WORKBOOK, workbook],
        ...(withMethodologie
          ? [[METHODOLOGIE, methodologie] as [string, Uint8Array]]
          : []),
      ],
    });
    built.fichiers[0] = { nom: SNBC3_PARQUET_FILE, ...declaredParquet };
    this.files.set(METHODOLOGIE, methodologie);
    this.files.set(SNBC3_PARQUET_FILE, parquet);
    this.files.set(WORKBOOK, workbook);
    this.files.set(
      SNBC3_MANIFEST_FILE,
      toBytes(overrideManifest ? overrideManifest(built) : built)
    );
  }
}

describe('Snbc3ArtifactReader : vérification contre le manifeste', () => {
  const parquet = new Uint8Array([10, 20, 30, 40]);

  test('lit une release conforme à son manifeste', async () => {
    const reader = new MemorySnbc3ArtifactReader();
    reader.publish({ parquet });
    const release = await reader.readRelease(VERSION);
    expect(release).toMatchObject({
      success: true,
      data: {
        version: VERSION,
        commit: COMMIT,
        datePublication: '2026-11-08T09:00:00.000Z',
        parquet,
        methodologie: {
          name: METHODOLOGIE,
          content: new Uint8Array([4, 5, 6]),
        },
      },
    });
  });

  test('une version inconnue est introuvable', async () => {
    const reader = new MemorySnbc3ArtifactReader();
    reader.publish({ parquet });
    expect(await reader.readRelease('9.9')).toEqual({
      success: false,
      error: 'SNBC3_ARTIFACT_NOT_FOUND',
    });
  });

  test('refuse une release sans PDF de méthodologie dans son manifeste', async () => {
    const reader = new MemorySnbc3ArtifactReader();
    reader.publish({ parquet, withMethodologie: false });
    expect(await reader.readRelease(VERSION)).toEqual({
      success: false,
      error: 'SNBC3_ARTIFACT_NOT_FOUND',
    });
  });

  test('refuse un parquet modifié de même taille (sha256)', async () => {
    const reader = new MemorySnbc3ArtifactReader();
    reader.publish({
      parquet: new Uint8Array([10, 20, 30, 41]),
      declaredParquet: {
        octets: parquet.byteLength,
        sha256: sha256Hex(parquet),
      },
    });
    expect(await reader.readRelease(VERSION)).toMatchObject({
      success: false,
      error: 'SNBC3_ARTIFACT_INVALID',
    });
  });

  test('refuse une taille différente de celle du manifeste', async () => {
    const reader = new MemorySnbc3ArtifactReader();
    reader.publish({
      parquet,
      declaredParquet: {
        octets: parquet.byteLength + 1,
        sha256: sha256Hex(parquet),
      },
    });
    expect(await reader.readRelease(VERSION)).toMatchObject({
      success: false,
      error: 'SNBC3_ARTIFACT_INVALID',
    });
  });

  test('refuse un manifeste d’une autre version', async () => {
    const reader = new MemorySnbc3ArtifactReader();
    reader.publish({
      parquet,
      manifest: (manifest) => ({ ...manifest, version: '2.2' }),
    });
    expect(await reader.readRelease(VERSION)).toMatchObject({
      success: false,
      error: 'SNBC3_ARTIFACT_INVALID',
    });
  });

  test('refuse un manifeste sans date de publication ni commit', async () => {
    const reader = new MemorySnbc3ArtifactReader();
    reader.publish({
      parquet,
      manifest: ({ version, fichiers }) => ({ version, fichiers }),
    });
    expect(await reader.readRelease(VERSION)).toMatchObject({
      success: false,
      error: 'SNBC3_ARTIFACT_INVALID',
    });
  });
  test.each([
    ['illisible', '08/11/2026'],
    ['sans fuseau', '2026-11-08T10:00:00'],
  ])('refuse une date de publication %s', async (_cas, datePublication) => {
    const reader = new MemorySnbc3ArtifactReader();
    reader.publish({
      parquet,
      manifest: (manifest) => ({
        ...manifest,
        date_publication: datePublication,
      }),
    });
    expect(await reader.readRelease(VERSION)).toMatchObject({
      success: false,
      error: 'SNBC3_ARTIFACT_INVALID',
    });
  });
});

describe('LocalSnbc3ArtifactReader : dossier de paquets', () => {
  let releasesPath: string;

  beforeAll(() => {
    releasesPath = mkdtempSync(join(tmpdir(), 'snbc3-releases-'));
    mkdirSync(join(releasesPath, getSnbc3ReleasePath(VERSION)));
    writeFileSync(
      join(releasesPath, getSnbc3ReleasePath(VERSION), 'present.txt'),
      'contenu'
    );
    return () => rmSync(releasesPath, { recursive: true, force: true });
  });

  /** Expose la release ouverte. */
  class TestedReader extends LocalSnbc3ArtifactReader {
    open(version: string) {
      return this.openRelease(version);
    }
  }

  const entry = (nom: string): Snbc3ManifestEntry => ({
    nom,
    octets: 0,
    sha256: '',
  });

  test('lit un fichier de la release', async () => {
    const opened = await new TestedReader(releasesPath).open(VERSION);
    if (!opened.success || !opened.data) throw new Error('release fermée');
    const read = await opened.data.readFile(entry('present.txt'));
    expect(read.success && Buffer.from(read.data ?? []).toString()).toBe(
      'contenu'
    );
  });

  test('un fichier absent de la release donne `null`', async () => {
    const opened = await new TestedReader(releasesPath).open(VERSION);
    if (!opened.success || !opened.data) throw new Error('release fermée');
    expect(await opened.data.readFile(entry('absent.txt'))).toEqual(
      success(null)
    );
    expect(await opened.data.readManifest()).toEqual(success(null));
  });

  test('une version sans dossier est introuvable', async () => {
    const reader = new TestedReader(releasesPath);
    expect(await reader.open('9.9')).toEqual(success(null));
    expect(await reader.readRelease('9.9')).toMatchObject({
      success: false,
      error: 'SNBC3_ARTIFACT_NOT_FOUND',
    });
  });

  test('un dossier de paquets inexistant est injoignable, pas absent', async () => {
    const reader = new TestedReader(join(releasesPath, 'inexistant'));
    expect(await reader.open(VERSION)).toMatchObject({
      success: false,
      error: 'SNBC3_REPOSITORY_UNREACHABLE',
    });
  });
});

describe('GithubSnbc3ArtifactReader : assets de la release', () => {
  const repositoryUrl = 'https://github.com/incubateur-ademe/snbc3';
  const releaseUrl =
    'https://api.github.com/repos/incubateur-ademe/snbc3/releases/tags/v2.3';
  /** URL d'API de l'asset : GitHub l'identifie par un numéro, ici son nom. */
  const downloadUrl = (name: string) =>
    `https://api.github.com/repos/incubateur-ademe/snbc3/releases/assets/${encodeURIComponent(
      name
    )}`;

  const parquet = new Uint8Array([10, 20, 30, 40]);
  const workbook = new Uint8Array([1, 2, 3]);
  const methodologie = new Uint8Array([4, 5, 6]);
  /** Noms du manifeste : GitHub renomme les assets (espaces, accents). */
  const manifest = buildSnbc3Manifest({
    version: '2.3',
    commit: COMMIT,
    datePublication: DATE_PUBLICATION,
    fichiers: [
      [SNBC3_PARQUET_FILE, parquet],
      ['Trajectoire GES de référence-V2.xlsx', workbook],
      ['ADEME-Methodo-Outil-trajectoire-référence-V2.pdf', methodologie],
    ],
  });
  const manifestBytes = toBytes(manifest);

  const asset = (name: string, content: Uint8Array) => ({
    name,
    size: content.byteLength,
    digest: `sha256:${sha256Hex(content)}` as string | null,
    url: downloadUrl(name),
  });
  const assets = [
    asset(SNBC3_MANIFEST_FILE, manifestBytes),
    asset(SNBC3_PARQUET_FILE, parquet),
    asset('Trajectoire.GES.de.reference-V2.xlsx', workbook),
    asset('ADEME-Methodo-Outil-trajectoire-reference-V2.pdf', methodologie),
  ];
  const contents = new Map<string, Uint8Array>([
    [downloadUrl(SNBC3_MANIFEST_FILE), manifestBytes],
    [downloadUrl(SNBC3_PARQUET_FILE), parquet],
    [downloadUrl('Trajectoire.GES.de.reference-V2.xlsx'), workbook],
    [
      downloadUrl('ADEME-Methodo-Outil-trajectoire-reference-V2.pdf'),
      methodologie,
    ],
  ]);

  const reply = (
    status: number,
    body: BodyInit | null,
    headers: Record<string, string> = {}
  ) => new Response(body, { status, headers });

  /** GitHub simulé : la release, puis les téléchargements d'assets. */
  const stubGithub = (
    release: Response | (() => Response) = () =>
      reply(200, JSON.stringify({ assets }))
  ) => {
    const fetchMock = vi.fn(
      async (input: string | URL | Request, _init?: RequestInit) => {
        const url = String(input);
        if (url === releaseUrl) {
          return typeof release === 'function' ? release() : release;
        }
        const content = contents.get(url);
        return content
          ? reply(200, Buffer.from(content))
          : reply(404, 'Not Found');
      }
    );
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  };

  afterEach(() => vi.unstubAllGlobals());

  test('lit la release taguée v<version> et retrouve chaque fichier par son sha256', async () => {
    const fetchMock = stubGithub();
    const reader = new GithubSnbc3ArtifactReader({
      repositoryUrl,
      token: undefined,
    });

    const release = await reader.readRelease('2.3');
    expect(release).toMatchObject({
      success: true,
      data: {
        version: '2.3',
        commit: COMMIT,
        parquet,
        workbook: {
          name: 'Trajectoire GES de référence-V2.xlsx',
          content: workbook,
        },
        methodologie: {
          name: 'ADEME-Methodo-Outil-trajectoire-référence-V2.pdf',
          content: methodologie,
        },
      },
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(releaseUrl);
    expect(init.headers).toMatchObject({
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2026-03-10',
      'User-Agent': expect.any(String),
    });
    expect(init.headers).not.toHaveProperty('Authorization');
    expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual([
      releaseUrl,
      downloadUrl(SNBC3_MANIFEST_FILE),
      downloadUrl(SNBC3_PARQUET_FILE),
      downloadUrl('Trajectoire.GES.de.reference-V2.xlsx'),
      downloadUrl('ADEME-Methodo-Outil-trajectoire-reference-V2.pdf'),
    ]);
  });

  test('transmet le jeton, y compris aux téléchargements, et accepte une URL de clone', async () => {
    const fetchMock = stubGithub();
    expect(
      await new GithubSnbc3ArtifactReader({
        repositoryUrl: `${repositoryUrl}.git`,
        token: 'ghp_test',
      }).readRelease('2.3')
    ).toMatchObject({ success: true });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(releaseUrl);
    expect(init.headers).toMatchObject({ Authorization: 'Bearer ghp_test' });
    const [downloadedUrl, downloadInit] = fetchMock.mock.calls[2] as [
      string,
      RequestInit
    ];
    expect(downloadedUrl).toBe(downloadUrl(SNBC3_PARQUET_FILE));
    expect(downloadInit.headers).toMatchObject({
      Accept: 'application/octet-stream',
      Authorization: 'Bearer ghp_test',
    });
  });

  test('refuse une release dont un asset n’a pas d’empreinte', async () => {
    stubGithub(() =>
      reply(
        200,
        JSON.stringify({
          assets: assets.map((a) =>
            a.name === SNBC3_PARQUET_FILE ? { ...a, digest: null } : a
          ),
        })
      )
    );
    expect(
      await new GithubSnbc3ArtifactReader({
        repositoryUrl,
        token: undefined,
      }).readRelease('2.3')
    ).toMatchObject({ success: false, error: 'SNBC3_ARTIFACT_INVALID' });
  });

  test('un fichier du manifeste sans asset de même empreinte est introuvable', async () => {
    stubGithub(() =>
      reply(
        200,
        JSON.stringify({
          assets: assets.map((a) =>
            a.name.endsWith('.xlsx') ? { ...a, digest: 'sha256:0000' } : a
          ),
        })
      )
    );
    expect(
      await new GithubSnbc3ArtifactReader({
        repositoryUrl,
        token: undefined,
      }).readRelease('2.3')
    ).toMatchObject({ success: false, error: 'SNBC3_ARTIFACT_NOT_FOUND' });
  });

  test('une release sans tag est introuvable', async () => {
    stubGithub(() => reply(404, JSON.stringify({ message: 'Not Found' })));
    expect(
      await new GithubSnbc3ArtifactReader({
        repositoryUrl,
        token: undefined,
      }).readRelease('2.3')
    ).toMatchObject({ success: false, error: 'SNBC3_ARTIFACT_NOT_FOUND' });
  });

  test('un quota épuisé (403) rend le dépôt injoignable', async () => {
    stubGithub(() =>
      reply(403, JSON.stringify({ message: 'API rate limit exceeded' }), {
        'x-ratelimit-remaining': '0',
      })
    );
    expect(
      await new GithubSnbc3ArtifactReader({
        repositoryUrl,
        token: undefined,
      }).readRelease('2.3')
    ).toMatchObject({ success: false, error: 'SNBC3_REPOSITORY_UNREACHABLE' });
  });

  test('un asset d’une autre taille que le manifeste est refusé sans être téléchargé', async () => {
    const fetchMock = stubGithub(() =>
      reply(
        200,
        JSON.stringify({
          assets: assets.map((a) =>
            a.name === SNBC3_PARQUET_FILE ? { ...a, size: a.size + 1 } : a
          ),
        })
      )
    );
    expect(
      await new GithubSnbc3ArtifactReader({
        repositoryUrl,
        token: undefined,
      }).readRelease('2.3')
    ).toMatchObject({ success: false, error: 'SNBC3_ARTIFACT_INVALID' });
    expect(fetchMock.mock.calls.map(([input]) => String(input))).not.toContain(
      downloadUrl(SNBC3_PARQUET_FILE)
    );
  });

  test('un asset qui disparaît au téléchargement rend le dépôt injoignable', async () => {
    stubGithub();
    contents.delete(downloadUrl(SNBC3_PARQUET_FILE));
    try {
      expect(
        await new GithubSnbc3ArtifactReader({
          repositoryUrl,
          token: undefined,
        }).readRelease('2.3')
      ).toMatchObject({
        success: false,
        error: 'SNBC3_REPOSITORY_UNREACHABLE',
      });
    } finally {
      contents.set(downloadUrl(SNBC3_PARQUET_FILE), parquet);
    }
  });

  test('une erreur réseau rend le dépôt injoignable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed');
      })
    );
    expect(
      await new GithubSnbc3ArtifactReader({
        repositoryUrl,
        token: undefined,
      }).readRelease('2.3')
    ).toMatchObject({ success: false, error: 'SNBC3_REPOSITORY_UNREACHABLE' });
  });

  test('une réponse de GitHub hors contrat rend le dépôt injoignable', async () => {
    stubGithub(() => reply(200, JSON.stringify({ tag_name: 'v2.3' })));
    expect(
      await new GithubSnbc3ArtifactReader({
        repositoryUrl,
        token: undefined,
      }).readRelease('2.3')
    ).toMatchObject({ success: false, error: 'SNBC3_REPOSITORY_UNREACHABLE' });
  });
});
