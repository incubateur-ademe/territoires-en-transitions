import {refToEmoji} from 'utils/refToEmoji';
import {IndicateurReferentiel} from 'types/indicateur_referentiel';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {ActionTitleRead} from 'core-logic/api/endpoints/ActionTitleReadEndpoint';

export const actionToEmoji = (
  action: ActionDefinitionSummary | ActionTitleRead
) => (action.referentiel === 'eci' ? refToEmoji['eci'] : refToEmoji['cae']);

export const indicateurToEmoji = (indicateur: IndicateurReferentiel) =>
  indicateur.id.startsWith('eco') ? refToEmoji['eci'] : refToEmoji['cae'];

export const shortenLabel = (label: string) =>
  label.slice(0, 15) + `${label.length > 15 ? '...' : ''}`;
