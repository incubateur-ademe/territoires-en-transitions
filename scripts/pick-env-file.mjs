// Sélecteur interactif de fichier .env pour les targets make env-get / env-set.
// Affiche le menu sur stderr et écrit le chemin choisi sur stdout, afin que le
// Makefile puisse capturer la valeur : f=$(node scripts/pick-env-file.mjs).
import { existsSync, globSync } from 'node:fs';
import prompts from 'prompts';

const candidates = [
  '.env',
  ...globSync('apps/*/.env'),
  'e2e/.env',
  'packages/api/.env',
].filter((f) => existsSync(f));

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
