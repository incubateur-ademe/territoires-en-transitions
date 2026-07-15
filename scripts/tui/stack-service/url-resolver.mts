// Résolution des URLs locales des composants de la stack : apps (port
// décalé par worktree — même résolution que dev-apps run/checkPorts) et
// infra (ports fixes publiés par docker-compose.yml).
import { APPS } from '../../dev-apps.mjs';
import { readEnvValue } from '../../env-local.mjs';

const ENV_LOCAL = '.env.local';

// Vue « ports » d'APPS : permet l'indexation par un nom de service arbitraire.
const APP_PORTS: Record<string, { port: number }> = APPS;

// Ports fixes publiés par docker-compose.yml (`ports:`) — les apps, elles,
// sont en network_mode: host et leur port vient d'APPS (décalable par slot).
const INFRA_URLS: Record<string, string> = {
  kong: 'http://localhost:54321',
  db: 'postgresql://postgres:postgres@localhost:54322/postgres',
  studio: 'http://localhost:54323',
  mailpit: 'http://localhost:54324',
  redis: 'redis://localhost:6379',
  strapi: 'http://localhost:1337',
};

export class UrlResolver {
  urlFor(service: string): string | null {
    return APP_PORTS[service]
      ? `http://localhost:${this.#appPort(service)}`
      : INFRA_URLS[service] ?? null;
  }

  // Port effectif d'une app — même résolution que dev-apps (checkPorts).
  #appPort(app: string): number {
    const envVar = `${app.toUpperCase()}_PORT`;
    return Number(
      process.env[envVar] ??
        readEnvValue(ENV_LOCAL, envVar) ??
        APP_PORTS[app].port
    );
  }
}
