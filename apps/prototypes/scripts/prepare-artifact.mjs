import { cpSync, existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const ASSETS_DIR = 'next-assets';
const DROPPED_EXTENSIONS = ['.svg', '.eot'];
const REWRITTEN_EXTENSIONS = ['.html', '.js', '.css'];
const REPLACEMENT_CHARACTER = String.fromCodePoint(0xfffd);

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../out');

const listFiles = (dir) =>
  readdirSync(dir, { recursive: true })
    .map((path) => String(path))
    .filter((path) => statSync(join(dir, path)).isFile());

const rewriteAssetPaths = (content) =>
  content.replaceAll('_next/', `${ASSETS_DIR}/`);

const escapeReplacementCharacter = (content) =>
  content.replaceAll(REPLACEMENT_CHARACTER, '\\uFFFD');

const replaceTitle = (title) => (html) =>
  title
    ? html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    : html;

const { values: args } = parseArgs({
  options: {
    route: { type: 'string' },
    out: { type: 'string' },
    title: { type: 'string' },
  },
});

if (!args.route || !args.out) {
  console.error(
    'usage : prepare-artifact.mjs --route <slug> --out <dossier> [--title <titre>]'
  );
  process.exit(1);
}

const target = resolve(args.out);
const isFreeOrPreviousArtifact =
  !existsSync(target) ||
  readdirSync(target).length === 0 ||
  existsSync(join(target, 'files.json'));
if (!isFreeOrPreviousArtifact) {
  console.error(
    `${target} n'est ni vide ni une sortie de prepare-artifact.mjs : choisir un dossier vide.`
  );
  process.exit(1);
}

const page = `${args.route}.html`;
if (!existsSync(join(outDir, page))) {
  console.error(
    `${page} absent de apps/prototypes/out : lancer \`nx build prototypes\`.`
  );
  process.exit(1);
}

rmSync(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });

cpSync(join(outDir, page), join(target, page));
cpSync(join(outDir, '_next'), join(target, ASSETS_DIR), {
  recursive: true,
  filter: (source) => !DROPPED_EXTENSIONS.includes(extname(source)),
});

const transformsFor = (path) => [
  rewriteAssetPaths,
  ...(extname(path) === '.js' ? [escapeReplacementCharacter] : []),
  ...(path === page ? [replaceTitle(args.title)] : []),
];

const files = listFiles(target);
await Promise.all(
  files
    .filter((path) => REWRITTEN_EXTENSIONS.includes(extname(path)))
    .map(async (path) => {
      const content = await readFile(join(target, path), 'utf8');
      const transformed = transformsFor(path).reduce(
        (acc, transform) => transform(acc),
        content
      );
      await writeFile(join(target, path), transformed);
    })
);

const supportingFiles = Object.fromEntries(
  files.filter((path) => path !== page).map((path) => [path, path])
);
await writeFile(
  join(target, 'files.json'),
  `${JSON.stringify(supportingFiles, null, 2)}\n`
);

console.log(join(target, page));
console.log(
  `${
    Object.keys(supportingFiles).length
  } fichiers de support listés dans ${join(target, 'files.json')}`
);
