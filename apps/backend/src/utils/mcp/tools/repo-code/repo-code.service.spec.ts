import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, test, vi } from 'vitest';
import { GithubRepoClient } from './github-repo.client';
import { RepoCodeService } from './repo-code.service';

const buildService = (client: Partial<GithubRepoClient>) =>
  new RepoCodeService(client as GithubRepoClient);

describe('RepoCodeService', () => {
  test('search : borne la requête au dépôt et au dossier, raccourcit les extraits', async () => {
    const searchCode = vi.fn().mockResolvedValue(
      success({
        total: 2,
        matches: [
          {
            path: 'apps/backend/src/a.service.ts',
            fragments: ['x'.repeat(500)],
          },
          { path: 'apps/backend/.env', fragments: ['SECRET'] },
        ],
      })
    );
    const result = await buildService({ searchCode }).search({
      termes: 'canDeleteFiche',
      dossier: 'apps/backend/',
    });

    expect(searchCode).toHaveBeenCalledWith(
      'canDeleteFiche repo:incubateur-ademe/territoires-en-transitions path:apps/backend',
      10
    );
    expect(result).toMatchObject({
      success: true,
      data: {
        total: 2,
        resultats: [{ chemin: 'apps/backend/src/a.service.ts' }],
      },
    });
    expect(
      result.success && result.data.resultats[0].extraits[0].length
    ).toBeLessThan(310);
  });

  test('search : sans résultat, conseille de réduire les termes', async () => {
    const result = await buildService({
      searchCode: vi.fn().mockResolvedValue(success({ total: 0, matches: [] })),
    }).search({ termes: 'un deux trois quatre' });
    expect(result.success && result.data.conseil).toContain('list_repo_files');
  });

  test('search : sans jeton, l’erreur remonte telle quelle', async () => {
    const result = await buildService({
      searchCode: vi.fn().mockResolvedValue(failure('GITHUB_NOT_CONFIGURED')),
    }).search({ termes: 'fiche' });
    expect(result).toMatchObject({
      success: false,
      error: 'GITHUB_NOT_CONFIGURED',
    });
  });

  test('search : une page sans résultat affichable ne conclut pas à l’absence', async () => {
    const result = await buildService({
      searchCode: vi.fn().mockResolvedValue(
        success({
          total: 1,
          incomplete: false,
          matches: [{ path: 'apps/backend/.env', fragments: ['SECRET'] }],
        })
      ),
    }).search({ termes: 'secret' });
    expect(result.success && result.data.conseil).toContain(
      "aucun n'est affichable"
    );
  });

  test('search : une recherche interrompue par GitHub est signalée', async () => {
    const result = await buildService({
      searchCode: vi
        .fn()
        .mockResolvedValue(
          success({ total: 0, incomplete: true, matches: [] })
        ),
    }).search({ termes: 'fiche' });
    expect(result.success && result.data.conseil).toContain(
      "ne prouve pas l'absence"
    );
  });

  test('list : un arbre tronqué par GitHub est signalé, sans conclure à l’absence', async () => {
    const result = await buildService({
      listPaths: vi
        .fn()
        .mockResolvedValue(
          success({ paths: ['apps/backend/src/main.ts'], truncated: true })
        ),
    }).list({ dossier: 'apps/inconnu' });
    expect(result).toMatchObject({
      success: true,
      data: { totalFichiers: 0, partiel: expect.stringContaining('partie') },
    });
  });

  test('read : le lien encode les caractères spéciaux du chemin', async () => {
    const result = await buildService({
      readFile: vi.fn().mockResolvedValue(success('a')),
    }).read({ chemin: 'doc/notes #1.md' });
    expect(result.success && result.data.url).toBe(
      'https://github.com/incubateur-ademe/territoires-en-transitions/blob/main/doc/notes%20%231.md'
    );
  });

  test('list : dossier inconnu signalé, sortie du dépôt refusée', async () => {
    const service = buildService({
      listPaths: vi
        .fn()
        .mockResolvedValue(
          success({ paths: ['apps/backend/src/main.ts'], truncated: false })
        ),
    });
    expect(await service.list({ dossier: 'apps/inconnu' })).toMatchObject({
      success: false,
      error: 'FILE_NOT_FOUND',
    });
    expect(await service.list({ dossier: '../ailleurs' })).toMatchObject({
      success: false,
      error: 'PATH_NOT_ALLOWED',
    });
    expect(await service.list({ dossier: 'apps/backend' })).toMatchObject({
      success: true,
      data: { fichiers: ['apps/backend/src/main.ts'] },
    });
  });

  test('read : refuse un fichier d’environnement sans appeler GitHub', async () => {
    const readFile = vi.fn();
    expect(
      await buildService({ readFile }).read({ chemin: 'apps/backend/.env' })
    ).toMatchObject({ success: false, error: 'PATH_NOT_ALLOWED' });
    expect(readFile).not.toHaveBeenCalled();
  });

  test('read : tranche numérotée et lien vers le fichier', async () => {
    const result = await buildService({
      readFile: vi.fn().mockResolvedValue(success('a\nb\nc')),
    }).read({ chemin: './apps/backend/src/main.ts', debut: 2, lignes: 1 });
    expect(result).toEqual({
      success: true,
      data: {
        chemin: 'apps/backend/src/main.ts',
        url: 'https://github.com/incubateur-ademe/territoires-en-transitions/blob/main/apps/backend/src/main.ts',
        debut: 2,
        fin: 2,
        totalLignes: 3,
        contenu: '2\tb',
      },
    });
  });
});
