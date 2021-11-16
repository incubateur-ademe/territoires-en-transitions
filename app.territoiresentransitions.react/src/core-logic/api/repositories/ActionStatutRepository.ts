import {ActionStatutWrite} from 'generated/dataLayer/action_statut_write';
import {actionStatutWriteEndpoint} from 'core-logic/api/endpoints/ActionStatutWriteEndpoint';
import {actionStatutReadEndpoint} from 'core-logic/api/endpoints/ActionStatutReadEndpoint';
import {ActionStatutRead} from 'generated/dataLayer/action_statut_read';

class ActionStatutRepository {
  save(statut: ActionStatutWrite): Promise<ActionStatutWrite | null> {
    return actionStatutWriteEndpoint.save(statut);
  }

  async fetch(args: {
    epci_id: number;
    action_id: string;
  }): Promise<ActionStatutRead[]> {
    const results = await actionStatutReadEndpoint.getBy({
      epci_id: args.epci_id,
    });
    return results.filter(statut => statut.action_id === args.action_id);
  }
}

export const actionStatutRepository = new ActionStatutRepository();
