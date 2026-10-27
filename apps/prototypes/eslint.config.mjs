import { defineConfig } from 'eslint/config';
import { frontendEnforceModuleBoundaries } from '../../eslint-frontend.config.mjs';
import nextjsConfig from '../../eslint-nextjs.config.mjs';
import baseConfig from '../../eslint.config.mjs';
import { prototypesEslintPlugin } from './eslint/no-layout-classes.mjs';

/** Bibliothèques d'UI tierces : un prototype compose avec `@tet/ui`. */
const FOREIGN_UI_LIBRARIES = [
  '@radix-ui/*',
  '@headlessui/*',
  '@mui/*',
  '@chakra-ui/*',
  '@mantine/*',
  'antd',
  'react-bootstrap',
  'styled-components',
  '@emotion/*',
  'lucide-react',
  'react-icons',
  'react-icons/*',
];

const eslintConfig = defineConfig([
  ...nextjsConfig,
  ...baseConfig,
  frontendEnforceModuleBoundaries({
    allow: ['../../packages/ui/src/tailwind-preset', '@/prototypes'],
  }),
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: { prototypes: prototypesEslintPlugin },
    rules: {
      'prototypes/no-layout-classes': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: FOREIGN_UI_LIBRARIES,
              message:
                'Composer avec @tet/ui. Un composant manquant se crée dans `proposals/`.',
            },
            {
              group: ['@tet/ui/src/*', '**/packages/ui/src/*'],
              message:
                'Importer depuis `@tet/ui`, sans copier ni contourner ses composants.',
            },
          ],
        },
      ],
    },
  },
  {
    // Une proposition (variante ou nouveau composant du design system) peut
    // écrire son propre layout : c'est justement ce qui est à arbitrer. Les
    // valeurs arbitraires y restent signalées pour la revue.
    files: ['**/proposals/**/*.ts', '**/proposals/**/*.tsx'],
    rules: {
      'prototypes/no-layout-classes': 'warn',
    },
  },
]);

export default eslintConfig;
