import '@testing-library/jest-dom/extend-expect';
import {ActionStatutWriteEndpoint} from 'core-logic/api/endpoints/ActionStatutWriteEndpoint';
import {ActionStatutWrite} from 'generated/dataLayer/action_statut_write';

describe('Action-statut write endpoint', () => {
  it('Saving a statut should return an equivalent statut', async () => {
    const endpoint = new ActionStatutWriteEndpoint();
    const statut: ActionStatutWrite = {
      concerne: true,
      avancement: 'fait',
      action_id: 'cae_1.2.3.1',
      epci_id: 1,
    };
    const result = await endpoint.save(statut);
    expect(result!.epci_id).toEqual(statut.epci_id);
    expect(result!.concerne).toEqual(statut.concerne);
    expect(result!.action_id).toEqual(statut.action_id);
  });

  it('Saving a statut with bad epci should fail', async () => {
    const endpoint = new ActionStatutWriteEndpoint();
    const statut: ActionStatutWrite = {
      concerne: true,
      avancement: 'fait',
      action_id: 'cae_1.2.3.1',
      epci_id: 666,
    };
    const result = await endpoint.save(statut);
    expect(result).toEqual(null);
  });
});
