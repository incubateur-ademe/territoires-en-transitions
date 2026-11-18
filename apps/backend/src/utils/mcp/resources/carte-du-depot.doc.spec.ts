import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { CARTE_DU_DEPOT_DOC } from './carte-du-depot.doc';

const findRepoRoot = (from: string): string => {
  let current = from;
  while (!existsSync(join(current, 'pnpm-workspace.yaml'))) {
    const parent = dirname(current);
    if (parent === current) {
      throw new Error('Racine du dépôt introuvable');
    }
    current = parent;
  }
  return current;
};

describe('carte du dépôt', () => {
  const citedPaths = [
    ...new Set(
      [
        ...CARTE_DU_DEPOT_DOC.matchAll(
          /`((?:apps|packages|data_layer|doc|e2e|strapi)(?:\/[^`<*]+)?)`/g
        ),
      ].map((match) => match[1])
    ),
  ];

  test('cite assez de chemins pour que la garde ait un sens', () => {
    expect(citedPaths.length).toBeGreaterThan(40);
  });

  // Un dossier renommé laisse l'assistant chercher au mauvais endroit.
  test('ne cite que des chemins qui existent', () => {
    const root = findRepoRoot(process.cwd());
    expect(citedPaths.filter((path) => !existsSync(join(root, path)))).toEqual(
      []
    );
  });

  test('tient dans le prompt de l’agent', () => {
    expect(CARTE_DU_DEPOT_DOC.length).toBeLessThan(16_000);
  });
});
