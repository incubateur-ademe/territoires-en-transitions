// Sélecteur interactif de fichier .env pour les targets make env-get / env-set.
import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import prompts from 'prompts';

const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'vendor']);

function findEnvFiles(dir = '.', fileList = []) {
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        findEnvFiles(join(dir, entry.name), fileList);
      }
    } else if (entry.name.startsWith('.env')) {
      const fullPath = join(dir, entry.name);
      fileList.push(relative(process.cwd(), fullPath));
    }
  }

  return fileList;
}

const candidates = findEnvFiles();

if (candidates.length === 0) {
  console.error("Aucun fichier .env n'a été trouvé dans le projet.");
  process.exit(1);
}

const { file } = await prompts(
  {
    type: 'select',
    name: 'file',
    message: 'Quel fichier .env ?',
    choices: candidates.map((f) => ({
      title: f === '.env' ? '.env (racine)' : f,
      value: f,
    })),
    stdout: process.stderr,
  },
  { onCancel: () => process.exit(1) }
);

process.stdout.write(file);