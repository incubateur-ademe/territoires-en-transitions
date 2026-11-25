import { spawnSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { checkCanvas, type CanvasFiles } from './check-canvas.ts';
import { freshnessOf, type DesignSystemGit } from './freshness.ts';

const repoRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../..'
);

const COMMIT = /^[0-9a-f]{7,40}$/;
const REF = /^[\w./-]+$/;

const USAGE = [
  'usage :',
  '  design-handoff check --dir <dossier contenant project/> [--design-system-version <id>]',
  '  design-handoff freshness --published <sha> [--ref origin/main]',
].join('\n');

const isNeededPath = (path: string): boolean =>
  path === 'project/canvas.json' ||
  path.endsWith('.dc.html') ||
  /\/components\/bundle\.js$/.test(path);

const readCanvasFiles = async (dir: string): Promise<CanvasFiles> => {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  const paths = entries
    .filter((entry) => entry.isFile())
    .map((entry) =>
      relative(dir, join(entry.parentPath, entry.name)).split(sep).join('/')
    )
    .filter(isNeededPath);
  const contents = await Promise.all(
    paths.map((path) => readFile(join(dir, path), 'utf8'))
  );
  return Object.fromEntries(
    paths.map((path, index) => [path, contents[index] ?? ''])
  );
};

const gitSucceeds = (...args: ReadonlyArray<string>): boolean =>
  spawnSync('git', [...args], { cwd: repoRoot }).status === 0;

const gitOf = (ref: string): DesignSystemGit => ({
  isKnownCommit: (commit) =>
    gitSucceeds('cat-file', '-e', `${commit}^{commit}`),
  hasChangesSince: (commit) =>
    !gitSucceeds(
      'diff',
      '--quiet',
      commit,
      ref,
      '--',
      'packages/ui',
      'packages/design-tokens'
    ),
});

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    dir: { type: 'string' },
    'design-system-version': { type: 'string' },
    published: { type: 'string' },
    ref: { type: 'string', default: 'origin/main' },
  },
});

const reportUsage = (): void => {
  console.error(USAGE);
  process.exitCode = 1;
};

const runCheck = async (): Promise<void> => {
  const { dir } = values;
  if (!dir) return reportUsage();
  const check = checkCanvas({
    files: await readCanvasFiles(resolve(process.cwd(), dir)),
    currentDesignSystemVersion: values['design-system-version'],
  });
  console.log(JSON.stringify(check, null, 2));
};

const runFreshness = (): void => {
  const { published, ref = 'origin/main' } = values;
  if (!published || !COMMIT.test(published) || !REF.test(ref)) {
    return reportUsage();
  }
  const status = freshnessOf({
    git: gitOf(ref),
    publishedCommit: published,
  });
  console.log(JSON.stringify({ status }));
};

const [command] = positionals;

if (command === 'check') {
  await runCheck();
} else if (command === 'freshness') {
  runFreshness();
} else {
  reportUsage();
}
