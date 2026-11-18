import { describe, expect, test } from 'vitest';
import {
  buildCodeSearchQuery,
  isReadableFile,
  listRepoFolder,
  MAX_LISTED_FILES,
  MAX_READ_CHARS,
  normalizeRepoPath,
  sliceCode,
} from './repo-code.rules';

describe('chemins du dépôt', () => {
  test('normalise et refuse de sortir du dépôt', () => {
    expect(normalizeRepoPath('./apps/backend/')).toBe('apps/backend');
    expect(normalizeRepoPath('/apps/app/app/(authed)/[id]')).toBe(
      'apps/app/app/(authed)/[id]'
    );
    expect(normalizeRepoPath('apps/../../etc/passwd')).toBeNull();
  });

  test('écarte environnement, lockfile et binaires', () => {
    expect(isReadableFile('apps/backend/.env.staging')).toBe(false);
    expect(isReadableFile('.env.keys')).toBe(false);
    expect(isReadableFile('pnpm-lock.yaml')).toBe(false);
    expect(isReadableFile('apps/site/public/logo.png')).toBe(false);
    expect(isReadableFile('apps/backend/src/main.ts')).toBe(true);
  });
});

describe('listRepoFolder', () => {
  const paths = [
    'apps/backend/src/plans/fiches/delete-fiche/delete-fiche.service.ts',
    'apps/backend/src/plans/fiches/delete-fiche/delete-fiche.router.ts',
    'apps/backend/src/plans/fiches/fiches.router.ts',
    'apps/backend/src/plans/fiches-voisines/x.ts',
    'apps/backend/.env',
  ];

  test('petit dossier : tous les fichiers, sans le dossier homonyme voisin', () => {
    expect(listRepoFolder(paths, 'apps/backend/src/plans/fiches')).toEqual({
      dossier: 'apps/backend/src/plans/fiches',
      totalFichiers: 3,
      fichiers: paths.slice(0, 3),
      sousDossiers: [],
    });
  });

  test('gros dossier : enfants directs et taille des sous-dossiers', () => {
    const many = Array.from(
      { length: MAX_LISTED_FILES + 1 },
      (_, index) => `apps/app/src/plans/f${index}.ts`
    );
    const listing = listRepoFolder(['apps/README.md', ...many], 'apps');
    expect(listing.fichiers).toEqual(['apps/README.md']);
    expect(listing.sousDossiers).toEqual([
      { chemin: 'apps/app', fichiers: MAX_LISTED_FILES + 1 },
    ]);
  });

  test('filtre sur le chemin, sans tenir compte de la casse', () => {
    expect(listRepoFolder(paths, '', 'Delete-Fiche.service').fichiers).toEqual([
      paths[0],
    ]);
  });
});

describe('sliceCode', () => {
  const text = Array.from({ length: 300 }, (_, i) => `ligne ${i + 1}`).join(
    '\n'
  );

  test('numérote à partir de la ligne demandée', () => {
    const excerpt = sliceCode(text, 10, 3);
    expect(excerpt).toMatchObject({ debut: 10, fin: 12, totalLignes: 300 });
    expect(excerpt.contenu).toBe('10\tligne 10\n11\tligne 11\n12\tligne 12');
  });

  test('borne le nombre de lignes et de caractères', () => {
    expect(sliceCode(text, 1, 5_000).fin).toBe(200);
    const wide = Array.from({ length: 50 }, () => 'x'.repeat(1_000)).join('\n');
    const excerpt = sliceCode(wide);
    expect(excerpt.contenu.length).toBeLessThanOrEqual(MAX_READ_CHARS);
    expect(excerpt.fin).toBeLessThan(50);
  });

  test('début au-delà de la fin : dernière ligne', () => {
    expect(sliceCode('a\nb', 99)).toMatchObject({ debut: 2, fin: 2 });
  });
});

test('buildCodeSearchQuery borne la recherche au dépôt', () => {
  expect(
    buildCodeSearchQuery(
      'canDeleteFiche repo:autre/depot',
      'o/r',
      'apps/backend'
    )
  ).toBe('canDeleteFiche repo autre/depot repo:o/r path:apps/backend');
});
