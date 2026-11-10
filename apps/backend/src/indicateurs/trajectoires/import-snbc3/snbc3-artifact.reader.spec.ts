import { success } from '@tet/backend/utils/result.type';
import { execFileSync } from 'child_process';
import { createHash } from 'crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  getSnbc3ReleasePath,
  LocalSnbc3ArtifactReader,
  Snbc3ArtifactReader,
  SNBC3_PARQUET_FILE,
} from './snbc3-artifact.reader';

const SHA = 'a'.repeat(40);
const VERSION = '2.1';
const RELEASE_PATH = getSnbc3ReleasePath(VERSION);
const WORKBOOK = 'standalone.xlsx';
const METHODOLOGIE = 'methodologie.pdf';

const sha256 = (content: Uint8Array) =>
  createHash('sha256').update(content).digest('hex');

/** Dépôt en mémoire dont le manifeste peut mentir sur les fichiers. */
class MemorySnbc3ArtifactReader extends Snbc3ArtifactReader {
  readonly files = new Map<string, Uint8Array>();

  protected async resolveCommit(commit: string) {
    return success({ sha: commit, date: '2026-11-08T09:00:00.000Z' });
  }

  protected async readFile(_sha: string, path: string) {
    return success(this.files.get(path) ?? null);
  }

  publish({
    parquet,
    declaredParquet = { octets: parquet.byteLength, sha256: sha256(parquet) },
    withMethodologie = true,
  }: {
    parquet: Uint8Array;
    declaredParquet?: { octets: number; sha256: string };
    withMethodologie?: boolean;
  }) {
    const workbook = new Uint8Array([1, 2, 3]);
    const methodologie = new Uint8Array([4, 5, 6]);
    const manifest = {
      version: VERSION,
      fichiers: [
        { nom: SNBC3_PARQUET_FILE, ...declaredParquet },
        {
          nom: WORKBOOK,
          octets: workbook.byteLength,
          sha256: sha256(workbook),
        },
        ...(withMethodologie
          ? [
              {
                nom: METHODOLOGIE,
                octets: methodologie.byteLength,
                sha256: sha256(methodologie),
              },
            ]
          : []),
      ],
    };
    this.files.set(`${RELEASE_PATH}/${METHODOLOGIE}`, methodologie);
    this.files.set(`${RELEASE_PATH}/${SNBC3_PARQUET_FILE}`, parquet);
    this.files.set(`${RELEASE_PATH}/${WORKBOOK}`, workbook);
    this.files.set(
      `${RELEASE_PATH}/manifest.json`,
      new Uint8Array(Buffer.from(JSON.stringify(manifest)))
    );
  }
}

describe('Snbc3ArtifactReader : vérification contre le manifeste', () => {
  const parquet = new Uint8Array([10, 20, 30, 40]);

  test('lit une release conforme à son manifeste', async () => {
    const reader = new MemorySnbc3ArtifactReader();
    reader.publish({ parquet });
    const release = await reader.readRelease(SHA, VERSION);
    expect(release).toMatchObject({
      success: true,
      data: {
        sha: SHA,
        version: VERSION,
        parquet,
        methodologie: {
          name: METHODOLOGIE,
          content: new Uint8Array([4, 5, 6]),
        },
      },
    });
  });

  test('refuse une release sans PDF de méthodologie dans son manifeste', async () => {
    const reader = new MemorySnbc3ArtifactReader();
    reader.publish({ parquet, withMethodologie: false });
    expect(await reader.readRelease(SHA, VERSION)).toEqual({
      success: false,
      error: 'SNBC3_ARTIFACT_NOT_FOUND',
    });
  });

  test('refuse un parquet modifié de même taille (sha256)', async () => {
    const reader = new MemorySnbc3ArtifactReader();
    reader.publish({
      parquet: new Uint8Array([10, 20, 30, 41]),
      declaredParquet: { octets: parquet.byteLength, sha256: sha256(parquet) },
    });
    expect(await reader.readRelease(SHA, VERSION)).toMatchObject({
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
        sha256: sha256(parquet),
      },
    });
    expect(await reader.readRelease(SHA, VERSION)).toMatchObject({
      success: false,
      error: 'SNBC3_ARTIFACT_INVALID',
    });
  });
});

describe('LocalSnbc3ArtifactReader : erreurs de git', () => {
  let repositoryPath: string;
  let sha: string;

  beforeAll(() => {
    repositoryPath = mkdtempSync(join(tmpdir(), 'snbc3-'));
    const git = (...args: string[]) =>
      execFileSync(
        'git',
        [
          '-C',
          repositoryPath,
          '-c',
          'user.name=test',
          '-c',
          'user.email=test@example.org',
          '-c',
          'commit.gpgsign=false',
          ...args,
        ],
        { encoding: 'utf-8' }
      );
    git('init', '--quiet');
    writeFileSync(join(repositoryPath, 'present.txt'), 'contenu');
    git('add', 'present.txt');
    git('commit', '--quiet', '-m', 'init');
    sha = git('rev-parse', 'HEAD').trim();
    return () => rmSync(repositoryPath, { recursive: true, force: true });
  });

  /** Expose les méthodes protégées. */
  class TestedReader extends LocalSnbc3ArtifactReader {
    read(sha: string, path: string) {
      return this.readFile(sha, path);
    }
    resolve(commit: string) {
      return this.resolveCommit(commit);
    }
  }

  test('lit un fichier du commit', async () => {
    const read = await new TestedReader(repositoryPath).read(
      sha,
      'present.txt'
    );
    expect(read.success && Buffer.from(read.data ?? []).toString()).toBe(
      'contenu'
    );
  });

  test('un fichier absent du commit donne `null`', async () => {
    expect(
      await new TestedReader(repositoryPath).read(sha, 'absent.txt')
    ).toEqual(success(null));
  });

  test('un commit inconnu est introuvable', async () => {
    expect(
      await new TestedReader(repositoryPath).resolve('b'.repeat(40))
    ).toMatchObject({ success: false, error: 'SNBC3_ARTIFACT_NOT_FOUND' });
  });

  test('un dépôt invalide est injoignable, pas absent', async () => {
    const reader = new TestedReader(join(repositoryPath, 'inexistant'));
    expect(await reader.read(sha, 'present.txt')).toMatchObject({
      success: false,
      error: 'SNBC3_REPOSITORY_UNREACHABLE',
    });
    expect(await reader.resolve(sha)).toMatchObject({
      success: false,
      error: 'SNBC3_REPOSITORY_UNREACHABLE',
    });
  });
});
