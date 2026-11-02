import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import resolveConfig from 'tailwindcss/resolveConfig.js';
import { parseArgs } from 'node:util';
import { createServer } from 'vite';
import { buildComponents } from './build-components.mts';

const here = dirname(fileURLToPath(import.meta.url));
const uiRoot = resolve(here, '../..');
const repoRoot = resolve(uiRoot, '../..');

const { values: args } = parseArgs({
  options: { out: { type: 'string' } },
});
if (!args.out) {
  console.error('usage : export-design-system --out <dossier>');
  process.exit(1);
}
const outDir = resolve(process.cwd(), args.out);
const projectDir = join(outDir, 'project');

const SVG_LOGOS = [
  [
    'republique-francaise.svg',
    'republique-francaise.logo.tsx',
    'RepubliqueFrancaiseLogo',
  ],
  ['ademe.svg', 'ademe.logo.tsx', 'AdemeLogo'],
  [
    'territoires-en-transitions.svg',
    'territoires-en-transitions.logo.tsx',
    'TerritoiresEnTransitionsLogo',
  ],
  ['programme-tete.svg', 'programme-tete.logo.tsx', 'ProgrammeTeTeLogo'],
] as const;
const PNG_LOGOS = ['electrifions-la-france.png'] as const;

const git = (...gitArgs: string[]): string =>
  execFileSync('git', gitArgs, { cwd: repoRoot, encoding: 'utf8' }).trim();

const writeProjectFile = async (path: string, content: string | Buffer) => {
  const target = join(projectDir, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content);
};

const server = await createServer({
  root: uiRoot,
  configFile: false,
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false },
  resolve: { tsconfigPaths: true },
});

try {
  const load = (path: string) => server.ssrLoadModule(path);
  const [
    { designTokens },
    { preset },
    tokensModule,
    { usages },
    { parseGlobalCss },
    { buildReadme },
  ] = await Promise.all([
    load('@tet/design-tokens'),
    load('./src/tailwind-preset.ts'),
    load('./scripts/design-system-export/tokens.ts'),
    load('./scripts/design-system-export/usages.ts'),
    load('./scripts/design-system-export/global-css.ts'),
    load('./scripts/design-system-export/readme.ts'),
  ]);

  const theme = resolveConfig({ content: [], presets: [preset] })
    .theme as unknown as Readonly<
    Record<string, Readonly<Record<string, unknown>>>
  >;
  const globalCss = parseGlobalCss(
    await readFile(join(uiRoot, 'src/global.css'), 'utf8')
  );

  const tokens = tokensModule.buildTokens({
    name: 'Territoires en Transitions',
    meta: {
      source: 'github',
      repo: 'incubateur-ademe/territoires-en-transitions',
      ref: `${git('rev-parse', '--abbrev-ref', 'HEAD')}@${git(
        'rev-parse',
        '--short',
        'HEAD'
      )}`,
      package: 'packages/ui',
      paths: {
        tokens: [
          'packages/design-tokens/src/design-tokens.ts',
          'packages/ui/src/tailwind-preset.ts',
        ],
        fonts: ['packages/ui/src/assets/fonts'],
        assets: ['packages/ui/src/assets'],
        docs: ['packages/ui/scripts/design-system-export/brand-book.md'],
      },
      synced: new Date().toISOString().slice(0, 10),
    },
    colors: designTokens.colors,
    extraColors: globalCss.bodyColor
      ? [{ name: 'text-body', value: globalCss.bodyColor }]
      : [],
    fontStack: designTokens.fontFamily.sans,
    fontFaces: globalCss.fontFaces,
    fontSize: designTokens.fontSize,
    headings: globalCss.headings,
    paragraphes: globalCss.paragraphes,
    spacingScale: designTokens.spacingScale,
    tailwindSpacing: theme.spacing as Readonly<Record<string, string>>,
    radius: designTokens.borderRadius,
    boxShadow: designTokens.boxShadow,
    maxWidth: designTokens.maxWidth,
    zIndex: designTokens.zIndex,
    usages,
  });

  await writeProjectFile('tokens.json', `${JSON.stringify(tokens, null, 2)}\n`);
  await writeProjectFile('tokens.css', tokensModule.buildTokensCss(tokens));

  await Promise.all(
    tokens.type.fonts.map((font: { file: string }) =>
      mkdir(join(projectDir, 'fonts'), { recursive: true }).then(() =>
        copyFile(
          join(uiRoot, 'src/assets', font.file),
          join(projectDir, font.file)
        )
      )
    )
  );

  await Promise.all(
    SVG_LOGOS.map(async ([fileName, modulePath, exportName]) => {
      const logos = await load(`./src/assets/${modulePath}`);
      const Logo = logos[exportName] as ComponentType;
      await writeProjectFile(
        `assets/Logos/${fileName}`,
        renderToStaticMarkup(createElement(Logo))
      );
    })
  );
  await Promise.all(
    PNG_LOGOS.map(async (fileName) =>
      writeProjectFile(
        `assets/Logos/${fileName}`,
        await readFile(join(uiRoot, 'src/assets', fileName))
      )
    )
  );

  await writeProjectFile(
    'README.md',
    buildReadme({
      brandBook: await readFile(join(here, 'brand-book.md'), 'utf8'),
      rules: await readFile(join(here, 'rules.md'), 'utf8'),
    })
  );
  await Promise.all(
    [
      ['logos.md', 'assets/Logos/README.md'],
      ['cover.html', 'components/Cover/preview.html'],
    ].map(async ([source, target]) =>
      writeProjectFile(target, await readFile(join(here, source), 'utf8'))
    )
  );

  const { components, libraries } = await buildComponents({
    preset,
    uiRoot,
    repoRoot,
    projectDir,
    here,
  });
  await writeFile(
    join(outDir, 'index-fields.json'),
    `${JSON.stringify({ namespace: 'TeT', libraries }, null, 2)}\n`
  );

  console.log(
    `design system exporté dans ${projectDir} (${components.length} composants)`
  );
} finally {
  await server.close();
}
