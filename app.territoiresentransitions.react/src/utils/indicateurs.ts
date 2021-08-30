import {IndicateurReferentiel} from 'generated/models/indicateur_referentiel';
import {ActionReferentiel} from 'generated/models/action_referentiel';

export const isIndicateurRelatedToAction = (
  indicateur: IndicateurReferentiel,
  action: ActionReferentiel
): boolean => indicateur.action_ids.includes(action.id);
