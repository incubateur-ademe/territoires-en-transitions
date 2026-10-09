import { X509Certificate } from 'node:crypto';
import type {
  PeerCertificate,
  ConnectionOptions as TlsConnectionOptions,
} from 'node:tls';

export type QueueRedisConfig = {
  QUEUE_REDIS_HOST?: string;
  QUEUE_REDIS_PORT: number;
  QUEUE_REDIS_URL?: string;
  QUEUE_REDIS_TLS_CA?: string;
};

export type QueueRedisConnection = {
  host: string;
  port: number;
  username?: string;
  password?: string;
  db?: number;
  tls?: TlsConnectionOptions;
};

/**
 * Options de connexion Redis des queues BullMQ.
 *
 * Deux formes :
 * - `QUEUE_REDIS_HOST` + `QUEUE_REDIS_PORT` : Redis sans authentification
 *   (dev local, CI) ;
 * - `QUEUE_REDIS_URL`, qui prime (port 6379 par défaut) : Redis managé Scaleway, avec utilisateur,
 *   mot de passe et TLS (`rediss://user:password@ip:6379`).
 *
 * Avec `QUEUE_REDIS_TLS_CA`, le certificat du serveur est épinglé (cf.
 * `pinCertificate`). Sans, il est vérifié contre les CA du système : un cluster
 * Scaleway, auto-signé, est alors refusé. `QUEUE_REDIS_TLS_CA` est donc requis
 * en pratique avec `rediss://` sur Scaleway.
 */
export function buildQueueRedisConnection(
  config: QueueRedisConfig
): QueueRedisConnection {
  if (!config.QUEUE_REDIS_URL) {
    return {
      host: config.QUEUE_REDIS_HOST ?? '',
      port: config.QUEUE_REDIS_PORT,
    };
  }

  // L'erreur native de `new URL` contient l'URL complète, mot de passe compris :
  // on la remplace pour ne pas l'exposer dans les logs de démarrage.
  let url: URL;
  try {
    url = new URL(config.QUEUE_REDIS_URL);
  } catch {
    throw new Error(
      "QUEUE_REDIS_URL n'est pas une URL valide (caractères spéciaux du mot de passe à percent-encoder ?)"
    );
  }
  if (url.protocol !== 'redis:' && url.protocol !== 'rediss:') {
    throw new Error(
      `QUEUE_REDIS_URL doit commencer par redis:// ou rediss:// (reçu : ${url.protocol}//)`
    );
  }

  const connection: QueueRedisConnection = {
    // Une IPv6 garde ses crochets dans `hostname` (`[fd00::1]`), qu'ioredis
    // ne sait pas résoudre.
    host: url.hostname.replace(/^\[(.*)\]$/, '$1'),
    port: url.port ? Number(url.port) : 6379,
  };
  if (url.username) {
    connection.username = decodeURIComponent(url.username);
  }
  if (url.password) {
    connection.password = decodeURIComponent(url.password);
  }

  const db = url.pathname.slice(1);
  if (db) {
    if (!/^\d+$/.test(db)) {
      throw new Error(
        `QUEUE_REDIS_URL : numéro de base invalide (reçu : ${db})`
      );
    }
    connection.db = Number(db);
  }

  if (url.protocol === 'rediss:') {
    // Une variable déclarée mais vide est une erreur de configuration, pas une
    // absence : `pinCertificate` la refuse avec un message explicite.
    connection.tls =
      config.QUEUE_REDIS_TLS_CA !== undefined
        ? pinCertificate(config.QUEUE_REDIS_TLS_CA)
        : {};
  }

  return connection;
}

/**
 * Épingle le certificat d'un cluster Redis managé Scaleway.
 *
 * Ce certificat est auto-signé et propre au cluster : il sert d'ancre de
 * confiance (`ca`), et la connexion n'est acceptée que si le serveur présente
 * exactement ce certificat, comparé par empreinte SHA-256.
 *
 * Le contrôle du nom d'hôte est remplacé par cette comparaison, et non ajouté
 * : le nom alternatif du certificat ne correspond pas à l'adresse par laquelle
 * on joint le cluster (constaté en preprod : SAN `10.0.1.3`, IP privée
 * `10.0.1.11`). L'empreinte est un critère plus strict que le nom.
 */
function pinCertificate(rawPem: string): TlsConnectionOptions {
  // Un PEM injecté sur une ligne (secret, variable d'environnement) arrive
  // souvent avec des `\n` littéraux.
  const pem = rawPem.replace(/\\n/g, '\n');
  let pinned: string;
  try {
    pinned = new X509Certificate(pem).fingerprint256;
  } catch {
    throw new Error("QUEUE_REDIS_TLS_CA n'est pas un certificat PEM valide");
  }

  return {
    ca: pem,
    checkServerIdentity: (_host: string, cert: PeerCertificate) =>
      cert.fingerprint256 === pinned
        ? undefined
        : new Error(
            `Certificat Redis inattendu (${cert.fingerprint256}), attendu ${pinned}`
          ),
  };
}
