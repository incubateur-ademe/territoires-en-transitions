import { TokenRateLimiter } from '../token-rate-limiter';

type ModelLimiters = { tokens: TokenRateLimiter; requests: TokenRateLimiter };

/**
 * Quotas par minute d'un fournisseur, tenus modèle par modèle : chez Albert,
 * le modèle d'OCR ou de tri ne consomme pas le quota du modèle principal.
 */
export class ModelRateLimiters {
  private readonly byModel = new Map<string, ModelLimiters>();

  constructor(
    private readonly tokensPerMinute: number | null,
    private readonly requestsPerMinute: number | null,
    private readonly now: () => number = Date.now
  ) {}

  /**
   * Attend une place pour une requête de `estimatedTokens`, puis la réserve.
   * Rend de quoi corriger la réservation de tokens avec la consommation réelle.
   */
  async acquire(
    model: string,
    estimatedTokens: number,
    signal?: AbortSignal
  ): Promise<(actualTokens?: number) => void> {
    const limiters = this.limitersOf(model);
    await limiters.requests.acquire(1, signal);
    return limiters.tokens.acquire(estimatedTokens, signal);
  }

  /** Après un 429 : ce modèle ne reçoit plus rien pendant `ms`. */
  penalize(model: string, ms: number): void {
    const limiters = this.limitersOf(model);
    limiters.tokens.penalize(ms);
    limiters.requests.penalize(ms);
  }

  private limitersOf(model: string): ModelLimiters {
    let limiters = this.byModel.get(model);
    if (!limiters) {
      limiters = {
        tokens: new TokenRateLimiter(this.tokensPerMinute, this.now),
        requests: new TokenRateLimiter(this.requestsPerMinute, this.now),
      };
      this.byModel.set(model, limiters);
    }
    return limiters;
  }
}
