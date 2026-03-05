/**
 * Erreur métier typée pour les services.
 * Permet de transporter un code d'erreur sans utiliser error.message comme véhicule.
 *
 * @see doc/adr/0012-pattern-result.md - Erreurs normalisées dans le cadre des transactions
 */
export class DomainError<T extends string> extends Error {
  constructor(public readonly code: T) {
    super(code);
    this.name = 'DomainError';
    Object.setPrototypeOf(this, DomainError.prototype);
  }
}
