// Adapter docker compose de la stack `tet` : tout ce qui exécute le binaire
// docker vit ici (ps, logs -f, start/stop/restart) — le reste du TUI n'en
// connaît que cette interface. Les commandes tournent à la racine du dépôt
// (docker-compose.yml, projet `name: tet` fixe) quel que soit le cwd, et le
// binaire est surchargeable (DOCKER ?= de Makefile.local, relayé par make tui
// via l'environnement).
import { execFile, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));

// Ligne brute de `compose ps --format json`.
export interface PsRow {
  Service: string;
  Name?: string; // nom du conteneur (tet-<service>-1), clé de jointure stats
  State?: string;
  Health?: string;
  ExitCode?: number;
}

// Ligne brute de `compose stats --format json`.
export interface StatsRow {
  Name: string;
  MemUsage: string; // « 885.2MiB / 30.34GiB »
}

export type StackAction = 'start' | 'stop' | 'restart';

interface LogStreamOptions {
  tail: number;
  onChunk: (chunk: Buffer) => void;
  onError: (err: Error) => void;
}

export class DockerStack {
  #docker: string;
  #cwd: string;

  constructor({
    docker = process.env.DOCKER ?? 'docker',
    cwd = REPO_ROOT,
  }: { docker?: string; cwd?: string } = {}) {
    this.#docker = docker;
    this.#cwd = cwd;
  }

  async ps(): Promise<PsRow[]> {
    const stdout = await this.#compose(
      ['--profile', '*', 'ps', '-a', '--format', 'json'],
      { maxBuffer: 8 * 1024 * 1024 }
    );
    return this.#parseRows<PsRow>(stdout);
  }

  // Mémoire par conteneur. Attention : le sampling de `stats --no-stream`
  // prend ~2 s — à poller moins souvent que ps, jamais dans le même tick.
  async stats(): Promise<StatsRow[]> {
    const stdout = await this.#compose(
      ['--profile', '*', 'stats', '--no-stream', '--format', 'json'],
      { maxBuffer: 8 * 1024 * 1024 }
    );
    return this.#parseRows<StatsRow>(stdout);
  }

  // start | stop | restart, en place (sans recréation de conteneur, donc sans
  // remontage de bind mounts : utilisable d'un worktree). Accepte plusieurs
  // services en une invocation compose (compose les traite en parallèle) —
  // évite un process par service lors d'une bascule de profile.
  run(action: StackAction, ...services: string[]): Promise<string> {
    return this.#compose(['--profile', '*', action, ...services]);
  }

  // Session shell interactive dans le conteneur d'un service — bash si
  // présent, sh sinon. Le child hérite du TTY (stdio inherit) : à n'appeler
  // que TUI démonté. Résout à la sortie du shell, ne rejette jamais (une
  // erreur d'exec s'affiche sur le terminal, on revient au TUI).
  shell(service: string): Promise<void> {
    return new Promise((resolve) => {
      const child = spawn(
        this.#docker,
        // prettier-ignore
        ['compose', '--profile', '*', 'exec', service, 'sh', '-c', 'command -v bash >/dev/null && exec bash || exec sh'],
        { cwd: this.#cwd, stdio: 'inherit' }
      );
      child.on('exit', () => resolve());
      child.on('error', () => resolve());
    });
  }

  // Suit les logs d'un service ; onChunk reçoit les Buffers bruts
  // (stdout + stderr confondus). Retourne la fonction d'arrêt du flux.
  streamLogs(
    service: string,
    { tail, onChunk, onError }: LogStreamOptions
  ): () => void {
    const child = spawn(
      this.#docker,
      // --ansi always : flag global compose (avant logs) — sans lui, pas de
      // couleurs vers un pipe. --no-log-prefix : le préfixe `<service>-1 |`
      // est du bruit, la vue est déjà mono-service.
      // prettier-ignore
      ['compose', '--ansi', 'always', '--profile', '*', 'logs', '-f', '-n', String(tail), '--no-log-prefix', service],
      { cwd: this.#cwd, stdio: ['ignore', 'pipe', 'pipe'] }
    );
    child.stdout?.on('data', onChunk);
    child.stderr?.on('data', onChunk);
    child.on('error', onError);
    return () => child.kill('SIGTERM');
  }

  // `--format json` émet du NDJSON (un objet par ligne) ; d'anciennes
  // versions de compose sortent un tableau JSON — les deux sont tolérés, le
  // bruit hors JSON est ignoré.
  #parseRows<T>(stdout: string): T[] {
    const raw = stdout.trim();
    if (!raw) return [];
    if (raw.startsWith('[')) {
      try {
        return JSON.parse(raw) as T[];
      } catch {
        return [];
      }
    }
    const rows: T[] = [];
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      try {
        rows.push(JSON.parse(line) as T);
      } catch {
        /* bruit hors JSON ignoré */
      }
    }
    return rows;
  }

  #compose(
    args: string[],
    opts: { maxBuffer?: number; timeout?: number } = {}
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      execFile(
        this.#docker,
        ['compose', ...args],
        // timeout borné : un CLI docker bloqué (daemon lent, verrou compose)
        // rejette au lieu de figer indéfiniment les hooks usePoll/useStats.
        { cwd: this.#cwd, timeout: 15_000, ...opts },
        (err, stdout, stderr) =>
          err
            ? reject(new Error(stderr.trim() || err.message))
            : resolve(stdout)
      );
    });
  }
}
