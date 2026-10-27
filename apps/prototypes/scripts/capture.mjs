/*
 * Captures d'écran d'un prototype (ou d'une maquette) en desktop et mobile.
 *
 *   node apps/prototypes/scripts/capture.mjs --route <slug> --out <dossier>
 *   node apps/prototypes/scripts/capture.mjs --file <maquette.html> --out <dossier>
 *
 * `--route` sert le build statique `apps/prototypes/out` (lancer
 * `nx build prototypes` avant) ; `--file` ouvre un fichier HTML tel quel.
 * Écrit `<nom>-desktop.png` (1280px) et `<nom>-mobile.png` (390px).
 */
import { chromium } from '@playwright/test';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const VIEWPORTS = [
  ['desktop', { width: 1280, height: 900 }],
  ['mobile', { width: 390, height: 844 }],
];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../out');

/** Chemin servi → fichier du build statique (`/slug` → `slug.html`). */
const toBuildFile = (urlPath) => {
  const clean = decodeURIComponent(urlPath.split('?')[0] ?? '/');
  const candidates = [
    join(outDir, clean),
    join(outDir, `${clean}.html`),
    join(outDir, clean, 'index.html'),
  ];
  return candidates.find(
    (path) =>
      path.startsWith(outDir) && existsSync(path) && statSync(path).isFile()
  );
};

const serveBuild = () =>
  new Promise((resolveServer) => {
    const server = createServer((request, response) => {
      const file = toBuildFile(request.url ?? '/');
      if (!file) {
        response.writeHead(404).end();
        return;
      }
      response.writeHead(200, {
        'content-type': MIME_TYPES[extname(file)] ?? 'application/octet-stream',
      });
      createReadStream(file).pipe(response);
    });
    server.listen(0, '127.0.0.1', () => resolveServer(server));
  });

const { values: args } = parseArgs({
  options: {
    route: { type: 'string' },
    file: { type: 'string' },
    out: { type: 'string' },
  },
});

if (!args.out || (!args.route && !args.file)) {
  console.error(
    'usage : capture.mjs (--route <slug> | --file <maquette.html>) --out <dossier>'
  );
  process.exit(1);
}
if (args.route && !existsSync(join(outDir, 'index.html'))) {
  console.error('build statique absent : lancer `nx build prototypes` avant');
  process.exit(1);
}

const server = args.route ? await serveBuild() : undefined;
const url = args.route
  ? `http://127.0.0.1:${server.address().port}/${args.route.replace(/^\//, '')}`
  : pathToFileURL(resolve(args.file)).href;
const name = args.route ?? basename(args.file, extname(args.file));
const target = resolve(args.out);
await mkdir(target, { recursive: true });

const browser = await chromium.launch();
try {
  for (const [label, viewport] of VIEWPORTS) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const path = join(target, `${name}-${label}.png`);
    await page.screenshot({ path, fullPage: true });
    console.log(path);
    errors.forEach((message) =>
      console.error(`erreur (${label}) : ${message}`)
    );
    await page.close();
  }
} finally {
  await browser.close();
  server?.close();
}
