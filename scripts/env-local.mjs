// Helpers de lecture/écriture des fichiers .env.local (gitignorés) : une clé
// simple (COMPOSE_PROFILES…) ou un bloc géré délimité par des
// marqueurs, dont les lignes étrangères sont toujours préservées.
// Partagé par pick-stack.mjs, dev-scopes.mjs et worktree-env.mjs.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export const readEnvValue = (file, key) => {
  if (!existsSync(file)) return null;
  const line = readFileSync(file, 'utf8')
    .split('\n')
    .find((l) => l.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1).trim() : null;
};

export const writeEnvValue = (file, key, value) => {
  const line = `${key}=${value}`;
  const lines = existsSync(file) ? readFileSync(file, 'utf8').split('\n') : [];
  const i = lines.findIndex((l) => l.startsWith(`${key}=`));
  if (i >= 0) lines[i] = line;
  else {
    while (lines.length && lines[lines.length - 1] === '') lines.pop();
    lines.push(line, '');
  }
  writeFileSync(file, lines.join('\n'));
};

// Remplace (ou ajoute en fin de fichier) le bloc délimité par
// `# --- <name> ---` … `# --- /<name> ---`.
export const writeManagedBlock = (file, name, blockLines) => {
  const open = `# --- ${name} ---`;
  const close = `# --- /${name} ---`;
  const lines = existsSync(file) ? readFileSync(file, 'utf8').split('\n') : [];
  const start = lines.indexOf(open);
  const end = lines.indexOf(close);
  const block = [open, ...blockLines, close];
  if (start >= 0 && end > start) lines.splice(start, end - start + 1, ...block);
  else {
    while (lines.length && lines[lines.length - 1] === '') lines.pop();
    if (lines.length) lines.push('');
    lines.push(...block, '');
  }
  writeFileSync(file, lines.join('\n'));
};
