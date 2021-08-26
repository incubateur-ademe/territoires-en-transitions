import type {ActionReferentiel} from 'generated/models/action_referentiel';

export const searchById = (
  actions: ActionReferentiel[],
  id: string
): ActionReferentiel | undefined => {
  for (const action of actions) {
    if (action.id === id) return action;
    const found = searchById(action.actions, id);
    if (found) return found;
  }
  return undefined;
};
