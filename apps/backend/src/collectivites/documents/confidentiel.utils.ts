import { Column, eq, isNull, or, SQL } from 'drizzle-orm';

// `confidentiel === null` traité comme confidentiel (fail-closed) ; les liens
// (sans fichier) ne portent jamais de confidentialité et restent visibles.
export function excludeConfidentielRow({
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

export function hideConfidentielFichier({
  confidentielColumn,
  canReadConfidentiel,
}: {
  confidentielColumn: Column;
  canReadConfidentiel: boolean;
}): SQL | undefined {
  if (canReadConfidentiel) {
    return undefined;
  }
  return eq(confidentielColumn, false);
}
