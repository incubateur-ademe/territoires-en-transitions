import { Column, eq, isNull, or, SQL } from 'drizzle-orm';
import { bibliothequeFichierTable } from './models/bibliotheque-fichier.table';

// `confidentiel === null` traité comme confidentiel (fail-closed) ; les liens
// (sans fichier) ne portent jamais de confidentialité et restent visibles.
export function hideConfidentielFilter(
  fichierIdColumn: Column,
  canReadConfidentiel: boolean
): SQL | undefined {
  if (canReadConfidentiel) {
    return undefined;
  }
  return or(
    isNull(fichierIdColumn),
    eq(bibliothequeFichierTable.confidentiel, false)
  );
}
