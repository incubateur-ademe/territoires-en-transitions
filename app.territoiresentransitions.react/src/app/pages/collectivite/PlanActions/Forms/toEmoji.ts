import type {IndicateurReferentiel} from 'generated/models/indicateur_referentiel';
import type {ActionReferentiel} from 'generated/models/action_referentiel';

export const actionToEmoji = (action: ActionReferentiel) =>
  action.id.startsWith('eco') ? '♻' : '🌍';

export const indicateurToEmoji = (indicateur: IndicateurReferentiel) =>
  indicateur.id.startsWith('ec') ? '♻' : '🌍';
