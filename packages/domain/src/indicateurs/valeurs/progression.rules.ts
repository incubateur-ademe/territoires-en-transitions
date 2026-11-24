import { isNil } from 'es-toolkit';

const isFiniteNumber = (value: number | null | undefined): value is number =>
  !isNil(value) && Number.isFinite(value);

/**
 * Progression du résultat vers la valeur attendue :
 * `(valeurDepart - valeurUtilisee) / (valeurDepart - valeurAttendue)`.
 * Renvoie `null` si une valeur manque, si le dénominateur est nul ou si le
 * résultat n'est pas fini.
 */
export function computeProgression(
  valeurDepart: number | null | undefined,
  valeurAttendue: number | null | undefined,
  valeurUtilisee: number | null | undefined
): number | null {
  if (
    !isFiniteNumber(valeurDepart) ||
    !isFiniteNumber(valeurAttendue) ||
    !isFiniteNumber(valeurUtilisee)
  ) {
    return null;
  }
  const denominateur = valeurDepart - valeurAttendue;
  if (denominateur === 0) {
    return null;
  }
  const progression = (valeurDepart - valeurUtilisee) / denominateur;
  return Number.isFinite(progression) ? progression : null;
}
