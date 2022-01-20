import '@testing-library/jest-dom/extend-expect';
import {actionStatutReadEndpoint} from 'core-logic/api/endpoints/ActionStatutReadEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';
import {yiliCredentials} from 'test_utils/collectivites';

describe('Action-statut reading endpoint should retrieve data-layer default statuses', () => {
  beforeEach(async () => {
    await supabaseClient.auth.signIn(yiliCredentials);
  });

  it('Retrieves at least one status when collectivite_id is given', async () => {
    const results = await actionStatutReadEndpoint.getBy({collectivite_id: 1});
    expect(actionStatutReadEndpoint.lastResponse?.status).toBe(200);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].collectivite_id).toEqual(1);
  });
  it(
    'Retrieves at least one status when collectivite_id and action_id with status' +
      ' are given',
    async () => {
      const results = await actionStatutReadEndpoint.getBy({
        collectivite_id: 1,
        action_id: 'cae_1.1.1.1.1',
      });
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0]).toEqual(
        expect.objectContaining({
          action_id: 'cae_1.1.1.1.1',
          collectivite_id: 1,
        })
      );
    }
  );
  it(
    'Retrieves no statuses when collectivite_id and action_id without status are' +
      ' given',
    async () => {
      const results = await actionStatutReadEndpoint.getBy({
        collectivite_id: 1,
        action_id: 'test_1',
      });
      expect(results.length).toEqual(0);
    }
  );
});
