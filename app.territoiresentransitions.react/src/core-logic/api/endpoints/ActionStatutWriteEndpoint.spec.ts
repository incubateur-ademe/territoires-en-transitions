import '@testing-library/jest-dom/extend-expect';
import {ActionStatutWriteEndpoint} from 'core-logic/api/endpoints/ActionStatutWriteEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';
import {ActionStatutWrite} from 'generated/dataLayer/action_statut_write';
import {yiliCredentials} from 'test_utils/collectivites';
import {ActionAvancement} from 'generated/dataLayer/action_statut_read';

describe('Action-statut write endpoint', () => {
  beforeEach(async () => {
    await supabaseClient.auth.signInWithPassword(yiliCredentials);
  });

  beforeAll(async () => {
    await supabaseClient.auth.signInWithPassword(yiliCredentials);
  });
  it('Should be able to save and update a statut with basic avancement', async () => {
    const endpoint = new ActionStatutWriteEndpoint();
    const statut: ActionStatutWrite = {
      concerne: true,
      avancement: 'programme',
      action_id: 'cae_1.1.1.1.1',
      collectivite_id: 2,
    };
    // 1. Create
    const result = await endpoint.save(statut);
    expect(result).not.toBeNull();
    expect(result).toMatchObject(statut);

    // 2. Update
    const updatedStatut = {
      ...statut,
      avancement: 'pas_fait' as ActionAvancement,
    };
    const updateResult = await endpoint.save(updatedStatut);
    expect(updateResult).not.toBeNull();
    expect(updateResult).toMatchObject(updatedStatut);
  });

  it('Should be able to save and update a statut with detailed avancement', async () => {
    const endpoint = new ActionStatutWriteEndpoint();
    const statut: ActionStatutWrite = {
      concerne: true,
      avancement: 'detaille',
      avancement_detaille: [0.1, 0.8, 0.1],
      action_id: 'cae_1.1.1.1.2',
      collectivite_id: 2,
    };
    const result = await endpoint.save(statut);
    expect(result).not.toBeNull();
    expect(result).toMatchObject(statut);
  });

  it('Should not be able to save a statut with a wrong detailed avancement', async () => {
    const endpoint = new ActionStatutWriteEndpoint();
    const statut: ActionStatutWrite = {
      concerne: true,
      avancement: 'detaille',
      avancement_detaille: [0.1, 0.1], // Not correct length !
      action_id: 'cae_1.1.1.1.2',
      collectivite_id: 2,
    };
    const result = await endpoint.save(statut);
    expect(result).toBeNull();
  });

  it('Saving a statut with readonly collectivite should fail', async () => {
    const endpoint = new ActionStatutWriteEndpoint();
    const statut: ActionStatutWrite = {
      concerne: true,
      avancement: 'fait',
      action_id: 'cae_1.2.3.4',
      collectivite_id: 8, // Yili has no rights on this collectivite
    };
    const result = await endpoint.save(statut);
    expect(endpoint.lastResponse?.status).toBe(403);
    expect(result).toEqual(null);
  });
});
