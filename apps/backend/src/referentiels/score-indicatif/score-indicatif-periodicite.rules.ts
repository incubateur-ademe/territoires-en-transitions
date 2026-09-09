import {
  assertAnnualIndicateurPeriodicite,
  type IndicateurPeriodicite,
} from '@tet/domain/indicateurs';

type ScoreIndicatifIndicateurPeriodicite = Readonly<{
  indicateurId: number;
  identifiantReferentiel?: string | null;
  periodicite: IndicateurPeriodicite | null | undefined;
}>;

/**
 * Le score indicatif reste une capacité annuelle tant qu'aucune politique
 * métier d'agrégation n'a été définie. Cette règle commune protège le calcul,
 * la sélection et les snapshots contre toute projection mensuelle implicite.
 */
export function assertAnnualScoreIndicateurs(
  indicateurs: readonly ScoreIndicatifIndicateurPeriodicite[]
): void {
  indicateurs.forEach((indicateur) =>
    assertAnnualIndicateurPeriodicite(
      indicateur.periodicite,
      `Le score indicatif (${
        indicateur.identifiantReferentiel ?? indicateur.indicateurId
      })`
    )
  );
}

export function getAnnualScoreIndicatifPeriodicite(
  indicateurs: readonly ScoreIndicatifIndicateurPeriodicite[]
): 'annuelle' {
  if (indicateurs.length === 0) {
    throw new Error(
      'Le score indicatif exige au moins un indicateur de périodicité annuelle'
    );
  }
  assertAnnualScoreIndicateurs(indicateurs);
  return 'annuelle';
}
