import { readFileSync, writeFileSync } from 'node:fs';

const PRIVATE_PACKAGES = ['crisp-api', 'fbemitter'];

const isPrivate = (name) =>
  name.startsWith('@bryntum/') || PRIVATE_PACKAGES.includes(name);

const packageNameOf = (yamlKey) => {
  const key = yamlKey
    .trim()
    .replace(/^'/, '')
    .replace(/'?:.*$/, '');
  const versionAt = key.indexOf('@', key.startsWith('@') ? 1 : 0);
  return versionAt === -1 ? key : key.slice(0, versionAt);
};

const indentOf = (line) => line.length - line.trimStart().length;

const isEntryKey = (line) => [2, 6].includes(indentOf(line)) && /:/.test(line);

const stripPackageJson = (pkg) =>
  Object.fromEntries(
    Object.entries(pkg).map(([field, value]) =>
      /[dD]ependencies$/.test(field)
        ? [
            field,
            Object.fromEntries(
              Object.entries(value).filter(([name]) => !isPrivate(name))
            ),
          ]
        : [field, value]
    )
  );

const stripLockfile = (lines) =>
  lines.reduce(
    ({ kept, skippedIndent }, line) => {
      const insideSkipped =
        skippedIndent !== null &&
        (line.trim() === '' || indentOf(line) > skippedIndent);
      if (insideSkipped) return { kept, skippedIndent };
      if (isEntryKey(line) && isPrivate(packageNameOf(line))) {
        return { kept, skippedIndent: indentOf(line) };
      }
      return { kept: [...kept, line], skippedIndent: null };
    },
    { kept: [], skippedIndent: null }
  ).kept;

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
writeFileSync(
  'package.json',
  `${JSON.stringify(stripPackageJson(pkg), null, 2)}\n`
);

const lockfile = readFileSync('pnpm-lock.yaml', 'utf8').split('\n');
writeFileSync('pnpm-lock.yaml', stripLockfile(lockfile).join('\n'));
