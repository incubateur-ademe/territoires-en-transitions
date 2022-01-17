import {ActionStatutWrite} from 'generated/dataLayer/action_statut_write';
import {actionStatutWriteEndpoint} from 'core-logic/api/endpoints/ActionStatutWriteEndpoint';
import {actionStatutReadEndpoint} from 'core-logic/api/endpoints/ActionStatutReadEndpoint';
import {ActionStatutRead} from 'generated/dataLayer/action_statut_read';

class ActionStatutRepository {
  save(statut: ActionStatutWrite): Promise<ActionStatutWrite | null> {
    return actionStatutWriteEndpoint.save(statut);
  }

  async fetch(args: {
    collectiviteId: number;
    actionId: string;
  }): Promise<ActionStatutRead | null> {
    const results = await actionStatutReadEndpoint.getBy({
      collectivite_id: args.collectiviteId,
    });

    return results.find(statut => statut.action_id === args.actionId) || null;
  }

  async fetchRenseigneChildren(args: {
    collectiviteId: number;
    actionId: string;
  }): Promise<ActionStatutRead[]> {
    const results = await actionStatutReadEndpoint.getBy({
      collectivite_id: args.collectiviteId,
    });

    const childrenIdPrefix = args.actionId + '.';
    return results.filter(
      statut =>
        statut.action_id.startsWith(childrenIdPrefix) &&
        statut.avancement !== 'non_renseigne'
    );
  }
}

export const actionStatutRepository = new ActionStatutRepository();
