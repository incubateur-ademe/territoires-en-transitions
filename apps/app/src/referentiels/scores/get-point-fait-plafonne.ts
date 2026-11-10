import { ActionScore } from '@tet/domain/referentiels';

/** Bruit max dû aux arrondis : 5 valeurs arrondies à 3 décimales (5 × 0,0005) */
const ROUNDING_TOLERANCE = 2.5e-3;

/** Seule mesure plafonnée par une règle `score` (au % réalisé de la 1.2.3) */
const MESURE_PLAFONNEE = 'cae_3.3.5';

/** Les points sont arrondis à 3 décimales : on arrondit l'écart pareil */
const roundTo3 = (n: number) => Math.round(n * 1000) / 1000;

/** Ancêtres de la 3.3.5 : l'écart y remonte par la somme des points */
const ANCETRES_MESURE_PLAFONNEE = ['cae', 'cae_3', 'cae_3.3'];

// ponytail: aux ancêtres, l'écart inclut aussi les autres écarts de l'axe 3
// (ex. sous-mesure aux tâches toutes non concernées), affichés à tort en
// « plafonné ». Exposer le montant plafonné depuis le backend si ça gêne.
const isMesurePlafonnee = (actionId: string) =>
  actionId === MESURE_PLAFONNEE ||
  actionId.startsWith(`${MESURE_PLAFONNEE}.`) ||
  ANCETRES_MESURE_PLAFONNEE.includes(actionId);

/**
 * Points faits retirés par le plafond de la CAE 3.3.5 (≤ % réalisé de la 1.2.3).
 *
 * Le plafond réduit `pointFait` sans reporter la différence ailleurs : c'est
 * l'écart entre le potentiel et fait + programmé + pas fait + non renseigné.
 * Hors 3.3.5, un tel écart existe aussi (ex. sous-mesure dont toutes les
 * tâches sont non concernées) et n'est pas un plafond : on renvoie 0.
 */
export const getPointFaitPlafonne = (
  score: Pick<
    ActionScore,
    | 'actionId'
    | 'pointPotentiel'
    | 'pointFait'
    | 'pointProgramme'
    | 'pointPasFait'
    | 'pointNonRenseigne'
  >
): number => {
  if (!isMesurePlafonnee(score.actionId)) {
    return 0;
  }

  const ecart = roundTo3(
    (score.pointPotentiel ?? 0) -
      (score.pointFait ?? 0) -
      (score.pointProgramme ?? 0) -
      (score.pointPasFait ?? 0) -
      (score.pointNonRenseigne ?? 0)
  );

  return ecart > ROUNDING_TOLERANCE ? ecart : 0;
};
