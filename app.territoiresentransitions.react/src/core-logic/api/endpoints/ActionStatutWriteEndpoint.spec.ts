import '@testing-library/jest-dom/extend-expect';
import {ActionStatutWriteEndpoint} from 'core-logic/api/endpoints/ActionStatutWriteEndpoint';
import {supabase} from 'core-logic/api/supabase';
import {ActionStatutWrite} from 'generated/dataLayer/action_statut_write';

describe('Action-statut write endpoint', () => {
  beforeAll(async () => {
    await supabase.auth.signUp({email: 'yili@didi.com', password: 'yolododo'});
    await supabase.auth.signIn({email: 'yili@didi.com', password: 'yolododo'});
  });
  it('Saving a statut should return an equivalent statut', async () => {
    const endpoint = new ActionStatutWriteEndpoint();
    const statut: ActionStatutWrite = {
      concerne: true,
      avancement: 'fait',
      action_id: 'cae_1.2.3.4',
      epci_id: 1,
    };
    const result = await endpoint.save(statut);

    expect(result).not.toBeNull();
    expect(result).toEqual(
      expect.objectContaining({
        action_id: 'cae_1.2.3.4',
        epci_id: 1,
        concerne: true,
        avancement: 'fait',
      })
    );
  });

  it('Saving a statut with unknown epci should fail', async () => {
    await supabase.auth.signIn({email: 'yolo@dodo.com', password: 'yolododo'});
    const endpoint = new ActionStatutWriteEndpoint();
    const statut: ActionStatutWrite = {
      concerne: true,
      avancement: 'fait',
      action_id: 'cae_1.2.3.4',
      epci_id: 10000,
    };
    const result = await endpoint.save(statut);
    expect(result).toEqual(null);
  });
});
