import '@testing-library/jest-dom/extend-expect';
import {clientScoresReadEndpoint} from 'core-logic/api/endpoints/ClientScoresReadEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';
import {yiliCredentials} from 'test_utils/collectivites';

describe('ClientScores reading endpoint', () => {
  beforeEach(async () => {
    await supabaseClient.auth.signInWithPassword(yiliCredentials);
  });

  /// todo add fake score.
  it.skip('should retrieve data-layer 1 row for collectivite #1', async () => {
    const results = await clientScoresReadEndpoint.getBy({
      collectiviteId: 1,
      referentiel: 'cae',
    });

    expect(results).toHaveLength(1);
    expect(results[0].scores).toHaveLength(2); // Fix datalayer `duplicate key value violates unique constraint` on second insert should fix this test.
  });
});
