import {refToEmoji} from 'utils/refToEmoji';
import {ActionReferentiel} from 'types/action_referentiel';
import {IndicateurReferentiel} from 'types/indicateur_referentiel';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';

export const actionToEmoji = (
  action: ActionReferentiel | ActionDefinitionSummary
) => (action.id.startsWith('eco') ? refToEmoji['eci'] : refToEmoji['cae']);

export const indicateurToEmoji = (indicateur: IndicateurReferentiel) =>
  indicateur.id.startsWith('eco') ? refToEmoji['eci'] : refToEmoji['cae'];

export const shortenLabel = (label: string) =>
  label.slice(0, 15) + `${label.length > 15 ? '...' : ''}`;
