/*
 * Build des composants du design system publié : `@tet/ui` compilé en un
 * script classique (`window.TeT`), React 19 en bibliothèques globales, le CSS
 * Tailwind, les types, et un aperçu + un README par composant tiré de ses
 * stories. Appelé par `export.mts`.
 */
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import { JSDOM } from 'jsdom';
import { build, type Alias } from 'vite';
import {
  bundleHeader,
  componentReadme,
  entrySource,
  escapeForInlineScript,
  groupStoryFiles,
  jsDocAbove,
  parseStoryFile,
  previewHtml,
  publicExportLines,
  stripDeclarationFile,
  toStoryLabel,
  type PublishedComponent,
} from './components.ts';

type BuildInput = Readonly<{
  /** Preset Tailwind de `@tet/ui`, chargé par Vite dans `export.mts`. */
  preset: object;
  uiRoot: string;
  repoRoot: string;
  projectDir: string;
  here: string;
}>;

export type Library = Readonly<{
  name: string;
  version: string;
  global: string;
  file: string;
}>;

export type BuildResult = Readonly<{
  components: ReadonlyArray<PublishedComponent>;
  libraries: ReadonlyArray<Library>;
}>;

/** Modules de `src/index.ts` laissés hors du bundle. */
const EXCLUDED_MODULES = [
  /^components\/tracking/, // dépend de `@tet/api` (session, PostHog)
  /DEPRECATED_/,
];

/** Dossiers de stories laissés hors des aperçus. */
const EXCLUDED_STORY_PATHS = [/DEPRECATED_/, /\/tracking\//];

const isExcludedModule = (modulePath: string): boolean =>
  EXCLUDED_MODULES.some((pattern) => pattern.test(modulePath));

const listFiles = async (
  dir: string,
  predicate: (path: string) => boolean
): Promise<ReadonlyArray<string>> => {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name))
    .filter(predicate)
    .sort();
};

const writeFileIn = async (path: string, content: string) => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
};

const readVersion = async (repoRoot: string, name: string): Promise<string> =>
  JSON.parse(
    await readFile(join(repoRoot, 'node_modules', name, 'package.json'), 'utf8')
  ).version;

/** Fichiers de stories lus statiquement, groupés par composant. */
const inventoryComponents = async (
  uiRoot: string
): Promise<ReadonlyArray<PublishedComponent>> => {
  const storyPaths = await listFiles(
    join(uiRoot, 'src'),
    (path) =>
      /\.stories\.tsx$/.test(path) &&
      /\/src\/(design-system|components)\//.test(path) &&
      !EXCLUDED_STORY_PATHS.some((pattern) => pattern.test(path))
  );
  const storyFiles = await Promise.all(
    storyPaths.map(async (path) =>
      parseStoryFile(relative(uiRoot, path), await readFile(path, 'utf8'))
    )
  );
  return groupStoryFiles(storyFiles);
};

const buildScripts = async ({
  uiRoot,
  repoRoot,
  projectDir,
  here,
  components,
}: BuildInput & { components: ReadonlyArray<PublishedComponent> }) => {
  const cacheDir = join(repoRoot, 'node_modules/.cache/tet-design-system');
  const shims = join(here, 'shims');
  const outDir = join(cacheDir, 'out');
  await rm(cacheDir, { recursive: true, force: true });

  const entries = {
    react: join(cacheDir, 'react-entry.ts'),
    reactDom: join(cacheDir, 'react-dom-entry.ts'),
    bundle: join(cacheDir, 'bundle-entry.ts'),
    reactGlobal: join(cacheDir, 'react-global.cjs'),
    reactDomGlobal: join(cacheDir, 'react-dom-global.cjs'),
  };
  await writeFileIn(
    entries.react,
    "import * as React from 'react';\nexport default React;\n"
  );
  await writeFileIn(
    entries.reactDom,
    [
      "import * as ReactDOM from 'react-dom';",
      "import * as ReactDOMClient from 'react-dom/client';",
      'export default { ...ReactDOM, ...ReactDOMClient };',
      '',
    ].join('\n')
  );
  await writeFileIn(entries.reactGlobal, 'module.exports = window.React;\n');
  await writeFileIn(
    entries.reactDomGlobal,
    'module.exports = window.ReactDOM;\n'
  );
  await writeFileIn(
    entries.bundle,
    entrySource({
      exportLines: publicExportLines(
        await readFile(join(uiRoot, 'src/index.ts'), 'utf8'),
        join(uiRoot, 'src'),
        isExcludedModule
      ),
      components,
      uiDir: uiRoot,
      previewModule: join(here, 'story-preview.tsx'),
    })
  );

  // Les bibliothèques et le bundle partagent une seule instance de React :
  // celle des globales `window.React` / `window.ReactDOM`.
  const reactAlias: Alias[] = [
    { find: /^react$/, replacement: entries.reactGlobal },
  ];
  const bundleAlias: Alias[] = [
    ...reactAlias,
    { find: /^react-dom(\/client)?$/, replacement: entries.reactDomGlobal },
    { find: /^next\/link$/, replacement: join(shims, 'next-link.tsx') },
    { find: /^next\/image$/, replacement: join(shims, 'next-image.tsx') },
    {
      find: /^next\/navigation$/,
      replacement: join(shims, 'next-navigation.ts'),
    },
    { find: /^next$/, replacement: join(shims, 'next.ts') },
    {
      find: /^@storybook\/nextjs-vite$/,
      replacement: join(shims, 'storybook.ts'),
    },
    {
      find: /^storybook\/(actions|test)$/,
      replacement: join(shims, 'storybook.ts'),
    },
  ];

  const buildIife = (
    entry: string,
    name: string,
    fileName: string,
    alias: ReadonlyArray<Alias>,
    exports: 'default' | 'named'
  ) =>
    build({
      root: uiRoot,
      configFile: false,
      logLevel: 'error',
      // Le serveur Vite d'export.mts a fixé NODE_ENV=development pour ce
      // process : sans ceci, le JSX serait compilé vers le runtime de dev.
      mode: 'production',
      oxc: { jsx: { runtime: 'automatic', development: false } },
      resolve: { tsconfigPaths: true, alias: [...alias] },
      define: {
        'process.env.NODE_ENV': '"production"',
        'process.env': '{}',
      },
      build: {
        outDir,
        emptyOutDir: false,
        minify: true,
        copyPublicDir: false,
        lib: { entry, name, formats: ['iife'], fileName: () => fileName },
        rollupOptions: { output: { exports } },
      },
    });

  await buildIife(entries.react, 'React', 'react.js', [], 'default');
  await buildIife(
    entries.reactDom,
    'ReactDOM',
    'react-dom.js',
    reactAlias,
    'default'
  );
  await buildIife(entries.bundle, 'TeT', 'bundle.js', bundleAlias, 'named');

  const [react, reactDom, bundle] = await Promise.all(
    ['react.js', 'react-dom.js', 'bundle.js'].map((file) =>
      readFile(join(outDir, file), 'utf8').then(escapeForInlineScript)
    )
  );
  await writeFileIn(join(projectDir, 'components/lib/react.js'), react ?? '');
  await writeFileIn(
    join(projectDir, 'components/lib/react-dom.js'),
    reactDom ?? ''
  );
  const bundleExports = listBundleExports([
    react ?? '',
    reactDom ?? '',
    bundle ?? '',
  ]);
  await writeFileIn(
    join(projectDir, 'components/bundle.js'),
    `${bundleHeader(components, bundleExports)}\n${bundle ?? ''}`
  );
  return bundleExports;
};

/**
 * Évalue les trois scripts dans un DOM de test, comme le ferait la page :
 * vérifie qu'ils s'exécutent et renvoie les exports de `window.TeT`.
 */
const listBundleExports = (
  scripts: ReadonlyArray<string>
): ReadonlySet<string> => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    runScripts: 'outside-only',
  });
  try {
    scripts.forEach((script) => dom.window.eval(script));
    const namespace = (
      dom.window as unknown as Record<string, object | undefined>
    )['TeT'];
    if (!namespace) throw new Error('le bundle ne définit pas window.TeT');
    return new Set(Object.keys(namespace));
  } finally {
    dom.window.close();
  }
};

/**
 * `global.css` compilé par Tailwind sur les sources de `@tet/ui`, sans les
 * `@font-face` (servies par tokens.css) et avec Remix Icon, sa police inlinée.
 */
const buildStylesheet = async ({
  preset,
  uiRoot,
  repoRoot,
  projectDir,
}: BuildInput) => {
  const globalCss = (await readFile(join(uiRoot, 'src/global.css'), 'utf8'))
    .replace(/^@import 'remixicon\/fonts\/remixicon\.css';\n/m, '')
    .replace(/@font-face\s*\{[^}]*\}\n?/g, '');
  const tailwind = await postcss([
    tailwindcss({
      presets: [preset],
      // Les classes des variantes de couleur (Badge…) vivent dans
      // @tet/design-tokens : à scanner comme dans la config des apps.
      content: [
        join(uiRoot, 'src/**/*.{ts,tsx}'),
        join(repoRoot, 'packages/design-tokens/src/**/*.{ts,tsx}'),
      ],
    }),
  ]).process(globalCss, { from: join(uiRoot, 'src/global.css') });

  const remixDir = join(repoRoot, 'node_modules/remixicon/fonts');
  const woff2 = (await readFile(join(remixDir, 'remixicon.woff2'))).toString(
    'base64'
  );
  // Toutes les déclarations `src` (eot, woff2, woff, ttf…) cèdent la place à
  // la seule police woff2, inlinée : le bundle CSS ne charge aucun fichier.
  const remixCss = (await readFile(join(remixDir, 'remixicon.css'), 'utf8'))
    .replace(/\s*src:[^;]*;/g, '')
    .replace(
      /@font-face\s*\{/,
      `@font-face {\n  src: url("data:font/woff2;base64,${woff2}") format("woff2");`
    );
  await writeFileIn(
    join(projectDir, 'components/bundle.css'),
    `${remixCss}\n${tailwind.css}`
  );
};

/** Déclarations émises par `nx typecheck ui` (out-tsc/lib) pour un dossier. */
const declarationsFor = async (
  uiRoot: string,
  sourceDir: string
): Promise<string> => {
  const dtsDir = join(uiRoot, 'out-tsc/lib', relative('src', sourceDir));
  const files = await listFiles(
    dtsDir,
    (path) => /\.d\.ts$/.test(path) && !/\.(stories|spec|test)/.test(path)
  ).catch(() => []);
  const contents = await Promise.all(
    files.map((file) => readFile(file, 'utf8'))
  );
  return contents.map(stripDeclarationFile).filter(Boolean).join('\n\n');
};

const writeComponentDocs = async ({
  uiRoot,
  projectDir,
  components,
  bundleExports,
}: BuildInput & {
  components: ReadonlyArray<PublishedComponent>;
  bundleExports: ReadonlySet<string>;
}) => {
  const docs = await Promise.all(
    components.map(async (component) => {
      const sourceDir = dirname(component.storyFiles[0]?.path ?? 'src');
      const sources = await listFiles(
        join(uiRoot, sourceDir),
        (path) => /\.tsx?$/.test(path) && !/\.(stories|spec|test)\./.test(path)
      );
      const summary = (
        await Promise.all(sources.map((path) => readFile(path, 'utf8')))
      )
        .map((source) => jsDocAbove(source, component.name))
        .find(Boolean);
      const storyDocs = (
        await Promise.all(
          component.storyFiles.map(async (file) => {
            const source = await readFile(join(uiRoot, file.path), 'utf8');
            return file.storyExports.map((name) => ({
              label: toStoryLabel(name),
              doc: jsDocAbove(source, name),
            }));
          })
        )
      ).flat();
      const declarations = await declarationsFor(uiRoot, sourceDir);
      const dir = join(projectDir, 'components', component.name);
      const isBundleExport = bundleExports.has(component.name);
      await writeFileIn(
        join(dir, 'preview.html'),
        previewHtml(component, isBundleExport)
      );
      await writeFileIn(
        join(dir, 'README.md'),
        componentReadme({
          component,
          isBundleExport,
          summary,
          storyDocs,
          sourceDir,
        })
      );
      await writeFileIn(
        join(dir, `${component.name}.d.ts`),
        `${declarations}\n`
      );
      return declarations;
    })
  );
  await writeFileIn(
    join(projectDir, 'components/index.d.ts'),
    `${[...new Set(docs)].filter(Boolean).join('\n\n')}\n`
  );
};

export const buildComponents = async (
  input: BuildInput
): Promise<BuildResult> => {
  const components = await inventoryComponents(input.uiRoot);
  const bundleExports = await buildScripts({ ...input, components });
  await buildStylesheet(input);
  await writeComponentDocs({ ...input, components, bundleExports });
  const [reactVersion, reactDomVersion] = await Promise.all([
    readVersion(input.repoRoot, 'react'),
    readVersion(input.repoRoot, 'react-dom'),
  ]);
  return {
    components,
    libraries: [
      {
        name: 'react',
        version: reactVersion,
        global: 'React',
        file: 'components/lib/react.js',
      },
      {
        name: 'react-dom',
        version: reactDomVersion,
        global: 'ReactDOM',
        file: 'components/lib/react-dom.js',
      },
    ],
  };
};
