// Helpers de lecture/écriture des fichiers .env.local (gitignorés) : une clé
// simple (COMPOSE_PROFILES…) ou un bloc géré délimité par des
// marqueurs, dont les lignes étrangères sont toujours préservées.
// Partagé par pick-stack.mts, dev-apps.mts et worktree-env.mts.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

// Tolère un fichier passé en CRLF (éditeur mal configuré) : sans ça les
// marqueurs de bloc ne matchent plus et le bloc serait dupliqué à chaque
// écriture. Les écritures re-normalisent en LF.
const readLines = (file: string): string[] =>
  existsSync(file) ? readFileSync(file, 'utf8').split(/\r?\n/) : [];

export const readEnvValue = (file: string, key: string): string | null => {
  const line = readLines(file).find((l) => l.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1).trim() : null;
};

export const writeEnvValue = (
  file: string,
  key: string,
  value: string
): void => {
  const line = `${key}=${value}`;
  const lines = readLines(file);
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
export const writeManagedBlock = (
  file: string,
  name: string,
  blockLines: string[]
): void => {
  const open = `# --- ${name} ---`;
  const close = `# --- /${name} ---`;
  const lines = readLines(file);
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
