import { isNil } from 'es-toolkit';

type ValeurAvecResultat = {
  dateValeur?: string | null;
  resultat?: number | null;
};

const toTime = (dateValeur: string | null | undefined) =>
  dateValeur ? new Date(dateValeur).getTime() : 0;

/**
 * Masque le résultat le plus récent : c'est ce que ne voit pas, pour un
 * indicateur confidentiel, qui n'a pas le droit de lecture confidentielle.
 */
export function maskDernierResultat<T extends ValeurAvecResultat>(
  valeurs: T[]
): T[] {
  const avecResultat = valeurs.filter((v) => !isNil(v.resultat));
  if (!avecResultat.length) {
    return valeurs;
  }
  const timeDernierResultat = Math.max(
    ...avecResultat.map((v) => toTime(v.dateValeur))
  );
  return valeurs.map((v) =>
    !isNil(v.resultat) &&
    v.dateValeur &&
    toTime(v.dateValeur) === timeDernierResultat
      ? { ...v, resultat: null }
      : v
  );
}
