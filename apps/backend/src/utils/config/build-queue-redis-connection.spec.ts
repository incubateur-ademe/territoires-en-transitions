import { X509Certificate } from 'node:crypto';
import type { PeerCertificate } from 'node:tls';
import { describe, expect, it } from 'vitest';
import { buildQueueRedisConnection } from './build-queue-redis-connection';

// Deux certificats auto-signés de test, à l'image de ceux des clusters Redis
// Scaleway : CA:FALSE, nom alternatif sur une IP.
const CLUSTER_CERT = `-----BEGIN CERTIFICATE-----
MIIBtjCCAV2gAwIBAgIUOlSqtzYEeRb5knI+FAIunBTBk3kwCgYIKoZIzj0EAwIw
KTEWMBQGA1UECgwNU2NhbGV3YXlSZWRpczEPMA0GA1UEAwwGdGVzdC1hMCAXDTI2
MTAwODE0MzQwMloYDzIxMjYwOTE0MTQzNDAyWjApMRYwFAYDVQQKDA1TY2FsZXdh
eVJlZGlzMQ8wDQYDVQQDDAZ0ZXN0LWEwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNC
AAS037WbYLiup+pLxGL4hLFjp5iWirUUR7MvtIxY2zPmQsCnRvIJhheSkYS1O/a8
ex4fbnFF2+WVyBHuV5K8jvIIo2EwXzAdBgNVHQ4EFgQUtXaWKcGoLLleMcGWvm+0
eAeEmeMwHwYDVR0jBBgwFoAUtXaWKcGoLLleMcGWvm+0eAeEmeMwDwYDVR0RBAgw
BocECgABAzAMBgNVHRMBAf8EAjAAMAoGCCqGSM49BAMCA0cAMEQCIHPBVem7WIe7
1lP3Ta39hbW0v7LrxiJEdXiWalTR5qoWAiATvqQ5VG72sHV5B55DbJgZR/gtwiDa
GEh8B0xiWGlCZg==
-----END CERTIFICATE-----`;
const OTHER_CERT = `-----BEGIN CERTIFICATE-----
MIIBtzCCAV2gAwIBAgIUA/LKWvPo5fwWTZhqQ7V+9DEm87owCgYIKoZIzj0EAwIw
KTEWMBQGA1UECgwNU2NhbGV3YXlSZWRpczEPMA0GA1UEAwwGdGVzdC1iMCAXDTI2
MTAwODE0MzQwMloYDzIxMjYwOTE0MTQzNDAyWjApMRYwFAYDVQQKDA1TY2FsZXdh
eVJlZGlzMQ8wDQYDVQQDDAZ0ZXN0LWIwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNC
AAT1mW8QXShM3HOL2f0pkIHOmuUuE+z/3rO5o+ipMG+IxIIPwAPe93SSp3eZWAyO
2Gfk3wNRFOEWtB6k2KxskTaMo2EwXzAdBgNVHQ4EFgQUvu+QM4UkFCObitbFDpKb
nL3X7k4wHwYDVR0jBBgwFoAUvu+QM4UkFCObitbFDpKbnL3X7k4wDwYDVR0RBAgw
BocECgABAzAMBgNVHRMBAf8EAjAAMAoGCCqGSM49BAMCA0gAMEUCIBVqnmIBOyGA
IW923rgnBt4DTgRfQokiTGFSqC7H71NIAiEAlNEN7SU/4xZog/UIJnzEoDJol4lC
LhOpnrYVpBm0Ogg=
-----END CERTIFICATE-----`;

const peer = (pem: string) =>
  ({
    fingerprint256: new X509Certificate(pem).fingerprint256,
  } as PeerCertificate);

describe('buildQueueRedisConnection', () => {
  it('se connecte par hôte et port quand aucune URL n’est fournie', () => {
    expect(
      buildQueueRedisConnection({
        QUEUE_REDIS_HOST: 'localhost',
        QUEUE_REDIS_PORT: 6379,
      })
    ).toEqual({ host: 'localhost', port: 6379 });
  });

  it('lit utilisateur, mot de passe, hôte et port dans l’URL, qui prime', () => {
    expect(
      buildQueueRedisConnection({
        QUEUE_REDIS_HOST: 'ignored',
        QUEUE_REDIS_PORT: 1234,
        QUEUE_REDIS_URL: 'redis://user:password@10.0.1.20:6380',
      })
    ).toEqual({
      host: '10.0.1.20',
      port: 6380,
      username: 'user',
      password: 'password',
    });
  });

  it('décode les caractères percent-encodés du mot de passe', () => {
    const connection = buildQueueRedisConnection({
      QUEUE_REDIS_PORT: 6379,
      QUEUE_REDIS_URL: 'redis://user:pass%40word@10.0.1.20:6379',
    });

    expect(connection.password).toBe('pass@word');
  });

  it('utilise le port Redis par défaut quand l’URL n’en précise pas', () => {
    const connection = buildQueueRedisConnection({
      QUEUE_REDIS_PORT: 6380,
      QUEUE_REDIS_URL: 'redis://10.0.1.20',
    });

    expect(connection.port).toBe(6379);
  });

  it('lit le numéro de base dans l’URL', () => {
    const connection = buildQueueRedisConnection({
      QUEUE_REDIS_PORT: 6379,
      QUEUE_REDIS_URL: 'redis://10.0.1.20:6379/2',
    });

    expect(connection.db).toBe(2);
  });

  it('refuse un numéro de base invalide', () => {
    expect(() =>
      buildQueueRedisConnection({
        QUEUE_REDIS_PORT: 6379,
        QUEUE_REDIS_URL: 'redis://10.0.1.20:6379/abc',
      })
    ).toThrow(/numéro de base invalide/);
  });

  it('retire les crochets d’une adresse IPv6', () => {
    const connection = buildQueueRedisConnection({
      QUEUE_REDIS_PORT: 6379,
      QUEUE_REDIS_URL: 'redis://[fd00::1]:6379',
    });

    expect(connection.host).toBe('fd00::1');
  });

  it('active TLS pour le schéma rediss://', () => {
    const connection = buildQueueRedisConnection({
      QUEUE_REDIS_PORT: 6379,
      QUEUE_REDIS_URL: 'rediss://10.0.1.20:6379',
    });

    expect(connection.tls).toEqual({});
  });

  it('épingle le certificat fourni, quel que soit le nom d’hôte', () => {
    const { tls } = buildQueueRedisConnection({
      QUEUE_REDIS_PORT: 6379,
      QUEUE_REDIS_URL: 'rediss://10.0.1.11:6379',
      QUEUE_REDIS_TLS_CA: CLUSTER_CERT,
    });

    expect(tls?.ca).toBe(CLUSTER_CERT);
    expect(
      tls?.checkServerIdentity?.('10.0.1.11', peer(CLUSTER_CERT))
    ).toBeUndefined();
  });

  it('refuse un autre certificat', () => {
    const { tls } = buildQueueRedisConnection({
      QUEUE_REDIS_PORT: 6379,
      QUEUE_REDIS_URL: 'rediss://10.0.1.11:6379',
      QUEUE_REDIS_TLS_CA: CLUSTER_CERT,
    });

    expect(tls?.checkServerIdentity?.('10.0.1.11', peer(OTHER_CERT))).toEqual(
      expect.objectContaining({
        message: expect.stringMatching(/Certificat Redis inattendu/),
      })
    );
  });

  it('accepte un certificat aux retours à la ligne échappés', () => {
    const { tls } = buildQueueRedisConnection({
      QUEUE_REDIS_PORT: 6379,
      QUEUE_REDIS_URL: 'rediss://10.0.1.11:6379',
      QUEUE_REDIS_TLS_CA: CLUSTER_CERT.replace(/\n/g, '\\n'),
    });

    expect(tls?.ca).toBe(CLUSTER_CERT);
  });

  it('refuse au démarrage un QUEUE_REDIS_TLS_CA vide', () => {
    expect(() =>
      buildQueueRedisConnection({
        QUEUE_REDIS_PORT: 6379,
        QUEUE_REDIS_URL: 'rediss://10.0.1.11:6379',
        QUEUE_REDIS_TLS_CA: '',
      })
    ).toThrow(/certificat PEM valide/);
  });

  it('refuse une URL invalide sans exposer le mot de passe', () => {
    expect(() =>
      buildQueueRedisConnection({
        QUEUE_REDIS_PORT: 6379,
        QUEUE_REDIS_URL: 'rediss://user:pass#word@10.0.1.11:6379',
      })
    ).toThrow(
      expect.objectContaining({
        message: expect.not.stringContaining('user:pass'),
      })
    );
  });

  it('refuse au démarrage un QUEUE_REDIS_TLS_CA qui n’est pas un certificat', () => {
    expect(() =>
      buildQueueRedisConnection({
        QUEUE_REDIS_PORT: 6379,
        QUEUE_REDIS_URL: 'rediss://10.0.1.11:6379',
        QUEUE_REDIS_TLS_CA: 'pas un certificat',
      })
    ).toThrow(/certificat PEM valide/);
  });

  it('refuse un schéma autre que redis:// ou rediss://', () => {
    expect(() =>
      buildQueueRedisConnection({
        QUEUE_REDIS_PORT: 6379,
        QUEUE_REDIS_URL: 'http://10.0.1.20:6379',
      })
    ).toThrow(/redis:\/\/ ou rediss:\/\//);
  });
});
