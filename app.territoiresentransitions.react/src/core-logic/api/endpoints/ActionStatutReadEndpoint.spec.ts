import '@testing-library/jest-dom/extend-expect';
import {ActionStatutReadEndpoint} from 'core-logic/api/endpoints/ActionStatutReadEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';
import {yuluCredentials} from 'test_utils/collectivites';

describe('Action-statut reading endpoint should retrieve data-layer default statuses', () => {
  it('Should not be able to read if not connected', async () => {
    const actionStatutReadEndpoint = new ActionStatutReadEndpoint([]);

    const results = await actionStatutReadEndpoint.getBy({
      collectivite_id: 1,
    });

    expect(results).toHaveLength(0);
  });

  it('Retrieves at least one status when collectivite_id is given (for any connected user)', async () => {
    const actionStatutReadEndpoint = new ActionStatutReadEndpoint([]);

    await supabaseClient.auth.signIn(yuluCredentials); // Yulu is connected but has no rights on collectivite #1

    const results = await actionStatutReadEndpoint.getBy({collectivite_id: 1});
    expect(actionStatutReadEndpoint.lastResponse?.status).toBe(200);
    expect(results.length).toBeGreaterThanOrEqual(1);
  });
});
