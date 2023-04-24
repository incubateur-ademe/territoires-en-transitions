import {TScoreAuditRowData} from 'app/pages/collectivite/AuditComparaison/types';
import {ProgressionRow} from 'app/pages/collectivite/Progression/queries';

/**
 * Définition des titres des axes pour les graphes
 * de scores par axe
 */

export const getIndexTitles = (
  scoreData: readonly (ProgressionRow | TScoreAuditRowData)[],
  addTotal: boolean
) => {
  let indexTitles = scoreData.map(
    d => `${d.action_id.split('_')[1]}. ${d.nom}`
  );
  if (addTotal) indexTitles.push('Total');

  return indexTitles;
};
