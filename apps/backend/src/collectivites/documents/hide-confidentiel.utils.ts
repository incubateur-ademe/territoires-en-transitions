import { Column, eq, isNull, or, SQL } from 'drizzle-orm';

// `confidentiel === null` traité comme confidentiel (fail-closed) ; les liens
// (sans fichier) ne portent jamais de confidentialité et restent visibles.
export function hideConfidentielFilter({
  fichierIdColumn,
  confidentielColumn,
  canReadConfidentiel,
}: {
  fichierIdColumn: Column;
  confidentielColumn: Column;
  canReadConfidentiel: boolean;
}): SQL | undefined {
  if (canReadConfidentiel) {
    return undefined;
  }
  return or(isNull(fichierIdColumn), eq(confidentielColumn, false));
}
