/**
 * Expression du DSL (personnalisation ou indicateur) qui ne peut pas être
 * tokenisée ou parsée. Erreur de domaine : c'est à l'appelant de choisir le
 * statut HTTP (422 à l'import, 500 si une formule en base est invalide).
 */
export class InvalidExpressionError extends Error {
  override name = 'InvalidExpressionError';
}
