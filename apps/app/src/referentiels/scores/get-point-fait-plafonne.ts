import { ActionScore } from '@tet/domain/referentiels';

/** Écart max dû aux arrondis à 3 décimales des points du score */
const ROUNDING_TOLERANCE = 5e-3;

/**
 * Points faits retirés par une règle de personnalisation de type `score`
 * (ex. CAE 3.3.5 plafonnée au % réalisé de la 1.2.3).
 *
 * Le plafond réduit `pointFait` sans reporter la différence ailleurs : c'est
 * le seul écart entre le potentiel et fait + programmé + pas fait + non renseigné.
 */
export const getPointFaitPlafonne = (
  score: Pick<
    ActionScore,
    | 'pointPotentiel'
    | 'pointFait'
    | 'pointProgramme'
    | 'pointPasFait'
    | 'pointNonRenseigne'
  >
): number => {
  const ecart =
    (score.pointPotentiel ?? 0) -
    (score.pointFait ?? 0) -
    (score.pointProgramme ?? 0) -
    (score.pointPasFait ?? 0) -
    (score.pointNonRenseigne ?? 0);

  return ecart > ROUNDING_TOLERANCE ? ecart : 0;
};
