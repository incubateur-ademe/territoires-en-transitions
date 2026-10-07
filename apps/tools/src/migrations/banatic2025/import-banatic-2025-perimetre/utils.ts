import { z } from 'zod';

/**
 * Colonnes utiles du fichier data.gouv « base nationale sur les
 * intercommunalités » (EPCI ↔ communes), une ligne par (EPCI, commune).
 * cf. `epci-perimetre.schema.ts` côté backend.
 */
const HEADER = {
  epciSiren: 'siren',
  communeInsee: 'insee',
  nbMembres: 'nb_membres',
} as const;

const rowSchema = z.object({
  epciSiren: z.string().min(1),
  communeInsee: z.string().min(1),
});

export type PerimetreRow = z.infer<typeof rowSchema>;

export const parsePerimetreRecords = (
  records: Record<string, string>[]
): PerimetreRow[] =>
  records
    .map((record) => {
      const parsed = rowSchema.safeParse({
        epciSiren: (record[HEADER.epciSiren] ?? '').trim(),
        communeInsee: (record[HEADER.communeInsee] ?? '').trim(),
      });
      return parsed.success ? parsed.data : null;
    })
    .filter((row): row is PerimetreRow => row !== null);

/**
 * Nombre de communes membres **distinctes** par SIREN d'EPCI.
 *
 * Aucun filtre de population : le dénominateur doit rester cohérent avec le
 * numérateur `nb_communes_transferees` (issu du fichier transfert brut Banatic).
 * cf. plan 2026-06-30-001, §1.3.
 */
export const countCommunesByEpci = (
  rows: PerimetreRow[]
): Map<string, number> => {
  const communesByEpci = new Map<string, Set<string>>();

  for (const row of rows) {
    const communes = communesByEpci.get(row.epciSiren) ?? new Set<string>();
    communes.add(row.communeInsee);
    communesByEpci.set(row.epciSiren, communes);
  }

  return new Map(
    Array.from(communesByEpci, ([siren, communes]) => [siren, communes.size])
  );
};

/**
 * Valeur `nb_membres` déclarée par data.gouv, par SIREN d'EPCI (répétée sur
 * chaque ligne). Sert uniquement de contrôle du recomptage `countCommunesByEpci`
 * — la valeur retenue en base reste le recomptage des communes distinctes.
 */
export const collectDeclaredNbMembres = (
  records: Record<string, string>[]
): Map<string, number> => {
  const byEpci = new Map<string, number>();

  for (const record of records) {
    const siren = (record[HEADER.epciSiren] ?? '').trim();
    if (!siren || byEpci.has(siren)) continue;

    const declared = Number(
      (record[HEADER.nbMembres] ?? '').replace(/\s+/g, '')
    );
    if (Number.isInteger(declared) && declared >= 0) {
      byEpci.set(siren, declared);
    }
  }

  return byEpci;
};

/** Écarts entre recomptage des communes distinctes et `nb_membres` déclaré. */
export const diffRecomptageVsDeclare = (
  recompteByEpci: Map<string, number>,
  declareByEpci: Map<string, number>
): { epciSiren: string; recompte: number; declare: number }[] => {
  const ecarts: { epciSiren: string; recompte: number; declare: number }[] = [];

  for (const [epciSiren, recompte] of recompteByEpci) {
    const declare = declareByEpci.get(epciSiren);
    if (declare !== undefined && declare !== recompte) {
      ecarts.push({ epciSiren, recompte, declare });
    }
  }

  return ecarts;
};
