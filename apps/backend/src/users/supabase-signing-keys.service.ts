import { Injectable, Logger } from '@nestjs/common';
import { getErrorMessage } from '@tet/domain/utils';
import { createPublicKey, JsonWebKey, KeyObject } from 'node:crypto';
import ConfigurationService from '../utils/config/configuration.service';

const CACHE_TTL_MS = 10 * 60 * 1000;
// Un `kid` inconnu relance la lecture, au plus une fois par intervalle : un
// jeton forgé avec un `kid` au hasard ne doit pas faire marteler Supabase.
const MIN_REFRESH_INTERVAL_MS = 30 * 1000;
const FETCH_TIMEOUT_MS = 5000;

/**
 * Clés publiques de signature des jetons Supabase (JWKS), pour les jetons
 * signés par une clé asymétrique (ES256, RS256). Le secret HS256 historique
 * n'y figure pas : il n'a pas de partie publique.
 */
@Injectable()
export class SupabaseSigningKeysService {
  private readonly logger = new Logger(SupabaseSigningKeysService.name);
  private keys = new Map<string, KeyObject>();
  private fetchedAt = 0;
  private pending: Promise<void> | null = null;

  constructor(private readonly config: ConfigurationService) {}

  /** Clé publique du `kid`, ou `null` si Supabase ne la publie pas. */
  async getPublicKey(kid: string): Promise<KeyObject | null> {
    const age = Date.now() - this.fetchedAt;
    if (
      age > CACHE_TTL_MS ||
      (!this.keys.has(kid) && age > MIN_REFRESH_INTERVAL_MS)
    ) {
      await this.refresh();
    }
    return this.keys.get(kid) ?? null;
  }

  private refresh(): Promise<void> {
    this.pending ??= this.fetchKeys().finally(() => {
      this.pending = null;
    });
    return this.pending;
  }

  private async fetchKeys(): Promise<void> {
    const url = `${this.config.get(
      'SUPABASE_URL'
    )}/auth/v1/.well-known/jwks.json`;
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const { keys } = (await response.json()) as { keys?: JsonWebKey[] };
      const next = new Map<string, KeyObject>();
      for (const jwk of keys ?? []) {
        if (typeof jwk.kid !== 'string') continue;
        next.set(jwk.kid, createPublicKey({ key: jwk, format: 'jwk' }));
      }
      this.keys = next;
    } catch (err) {
      // On garde les clés déjà connues : une panne passagère de Supabase ne
      // doit pas refuser des jetons qu'on savait vérifier.
      this.logger.error(
        `Failed to fetch Supabase signing keys from ${url}: ${getErrorMessage(
          err
        )}`
      );
    }
    this.fetchedAt = Date.now();
  }
}
