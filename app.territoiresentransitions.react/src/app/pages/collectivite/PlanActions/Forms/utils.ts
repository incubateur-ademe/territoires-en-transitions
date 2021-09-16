import type {IndicateurReferentiel} from 'generated/models/indicateur_referentiel';
import type {ActionReferentiel} from 'generated/models/action_referentiel';

export const refToEmoji = {eci: '♻', cae: '🌍'};

export const actionToEmoji = (action: ActionReferentiel) =>
  action.id.startsWith('eco') ? refToEmoji['eci'] : refToEmoji['cae'];

export const indicateurToEmoji = (indicateur: IndicateurReferentiel) =>
  indicateur.id.startsWith('eco') ? refToEmoji['eci'] : refToEmoji['cae'];

export const shortenLabel = (label: string) =>
  label.slice(0, 15) + `${label.length > 15 ? '...' : ''}`;
