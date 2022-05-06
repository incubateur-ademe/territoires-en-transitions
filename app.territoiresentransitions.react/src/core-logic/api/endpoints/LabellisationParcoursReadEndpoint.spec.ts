import '@testing-library/jest-dom/extend-expect';
import {labellisationParcoursReadEndpoint} from 'core-logic/api/endpoints/LabellisationParcoursReadEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';
import {yuluCredentials} from 'test_utils/collectivites';

describe('Labellisation reading endpoint ', () => {
  it('should not be able to read if not connected', async () => {
    const results = await labellisationParcoursReadEndpoint.getBy({
      collectivite_id: 1,
    });

    expect(results).toHaveLength(0);
  });
  it('should retrieve data-layer labellisation parcours for collectivite #1 (for any connected user) ', async () => {
    await supabaseClient.auth.signIn(yuluCredentials); // Yulu has not rights on collectivite #1
    const results = await labellisationParcoursReadEndpoint.getBy({
      collectivite_id: 1,
    });

    // 2 results expected (one per referentiel)
    expect(results).toHaveLength(2);
  });
});
