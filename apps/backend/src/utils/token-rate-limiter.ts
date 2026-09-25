const WINDOW_MS = 60_000;

type Reservation = { at: number; tokens: number };

/**
 * Budget de tokens par fenêtre glissante d'une minute. Un appel attend que la
 * place se libère plutôt que d'essuyer un 429 ; un appel plus gros que le
 * budget passe seul, fenêtre vide. Sans budget (null), tout passe.
 */
export class TokenRateLimiter {
  private reservations: Reservation[] = [];
  private frozenUntil = 0;

  constructor(
    private readonly budgetPerMinute: number | null,
    private readonly now: () => number = Date.now
  ) {}

  /**
   * Réserve `estimatedTokens` et rend une fonction pour corriger la
   * réservation une fois la consommation réelle connue.
   */
  async acquire(
    estimatedTokens: number,
    signal?: AbortSignal
  ): Promise<(actualTokens?: number) => void> {
    if (this.budgetPerMinute === null) {
      return () => undefined;
    }
    for (;;) {
      signal?.throwIfAborted();
      const waitMs = this.waitBeforeReserving(estimatedTokens);
      if (waitMs <= 0) {
        break;
      }
      await sleep(waitMs, signal);
    }
    const reservation: Reservation = {
      at: this.now(),
      tokens: estimatedTokens,
    };
    this.reservations.push(reservation);
    return (actualTokens) => {
      if (actualTokens !== undefined && actualTokens > 0) {
        reservation.tokens = actualTokens;
      }
    };
  }

  /** Après un 429 : aucune réservation avant `ms` millisecondes. */
  penalize(ms: number): void {
    this.frozenUntil = Math.max(this.frozenUntil, this.now() + ms);
  }

  private waitBeforeReserving(tokens: number): number {
    const now = this.now();
    if (now < this.frozenUntil) {
      return this.frozenUntil - now;
    }
    this.reservations = this.reservations.filter(
      (reservation) => now - reservation.at < WINDOW_MS
    );
    const used = this.reservations.reduce(
      (total, reservation) => total + reservation.tokens,
      0
    );
    if (used === 0 || used + tokens <= (this.budgetPerMinute as number)) {
      return 0;
    }
    return this.reservations[0].at + WINDOW_MS - now;
  }
}

const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason ?? new Error('aborted'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
