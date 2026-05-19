import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Les classes de couleur des Badge (`bg-primary-1`, `text-success-1`, ...)
 * vivent depuis le refactor de mai 2026 dans `@tet/design-tokens`. Tailwind ne
 * genere une classe que s'il scanne le fichier ou la chaine litterale apparait.
 *
 * Le `content` declare par le tailwind-preset partage n'est PAS fiable : depuis
 * Tailwind 3.3 les chemins relatifs d'un preset sont resolus relativement au
 * fichier du preset, donc `../../packages/design-tokens/...` pointe a cote.
 * Chaque app doit donc declarer elle-meme le scan de `packages/design-tokens`
 * dans son propre `content`, ou les chemins sont resolus relativement a l'app.
 * Sans cette ligne, les Badge s'affichent sans fond ni bordure.
 *
 * Le test lit les fichiers de config plutot que de les importer pour ne pas
 * creer de dependance cross-app (frontieres Nx).
 */

const repoRoot = path.resolve(import.meta.dirname, '../../..');
const apps = ['app', 'site', 'auth', 'panier'] as const;

describe('intégration Tailwind / design-tokens', () => {
  test.each(apps)(
    "la config Tailwind de l'app %s scanne packages/design-tokens",
    (appName) => {
      const config = readFileSync(
        path.join(repoRoot, 'apps', appName, 'tailwind.config.ts'),
        'utf8'
      );
      expect(config).toContain('packages/design-tokens/src');
    }
  );
});
