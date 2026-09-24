import {
  ActionScoreIndicatif,
  getReferentielIdFromActionId,
  isNewReferentiel,
  ReferentielId,
  ScoreIndicatifPayload,
  ScoreIndicatifType,
  scoreIndicatifTypeEnum,
} from '@tet/domain/referentiels';
import { pick } from 'es-toolkit';
import { IndicateurPeriodiciteEnum } from '@tet/domain/indicateurs';

/** Indique si une action appartient au référentiel donné (gère l'alias des nouveaux référentiels) */
export function actionBelongsToReferentiel(
  actionId: string,
  referentielId: ReferentielId
): boolean {
  try {
    const actionReferentielId = getReferentielIdFromActionId(actionId);
    if (isNewReferentiel(referentielId)) {
      return isNewReferentiel(actionReferentielId);
    }
    return actionReferentielId === referentielId;
  } catch {
    return false;
  }
}

/** Formate un score indicatif pour l'inclure dans le payload du snapshot */
export function formatScoreIndicatifForPayload(
  scoreIndicatif: ActionScoreIndicatif
): ScoreIndicatifPayload {
  return {
    // Le score utilise exclusivement les observations annuelles sélectionnées.
    periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
    unite: scoreIndicatif.indicateurs?.[0].unite,
    fait: formatValeursForPayload(scoreIndicatif, scoreIndicatifTypeEnum.FAIT),
    programme: formatValeursForPayload(
      scoreIndicatif,
      scoreIndicatifTypeEnum.PROGRAMME
    ),
  };
}

export function formatValeursForPayload(
  scoreIndicatif: ActionScoreIndicatif,
  typeScore: ScoreIndicatifType
) {
  const scoreData = scoreIndicatif[typeScore];
  if (!scoreData) return null;

  return {
    score: scoreData.score,
    valeursUtilisees: scoreData.valeursUtilisees.map(
      ({ sourceMetadonnee, ...valeur }) => ({
        ...pick(valeur, [
          'indicateurId',
          'valeur',
          'dateValeur',
          'sourceLibelle',
        ]),
        sourceMetadonnee: sourceMetadonnee
          ? pick(sourceMetadonnee, ['sourceId', 'dateVersion'])
          : null,
        identifiantReferentiel:
          scoreIndicatif.indicateurs.find(
            (ind) => ind.indicateurId === valeur.indicateurId
          )?.identifiantReferentiel || '',
      })
    ),
  };
}
