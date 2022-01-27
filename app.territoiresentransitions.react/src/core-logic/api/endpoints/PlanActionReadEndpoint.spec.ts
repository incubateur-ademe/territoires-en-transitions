import '@testing-library/jest-dom/extend-expect';
import {planActionReadEndpoint} from 'core-logic/api/endpoints/PlanActionReadEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';
import {yiliCredentials} from 'test_utils/collectivites';

describe('Plan action reading endpoint ', () => {
  beforeEach(async () => {
    await supabaseClient.auth.signIn(yiliCredentials);
  });

  it('should retrieve data-layer default plan for collectivite #1 ', async () => {
    const results = await planActionReadEndpoint.getBy({
      collectivite_id: 1,
    });

    expect(results.length).toBeGreaterThanOrEqual(1);
    const partialExpectedReadPlanAction = {
      collectivite_id: 1,
      nom: "Plan d'action de la collectivité",
    };
    expect(results[0]).toEqual(
      expect.objectContaining(partialExpectedReadPlanAction)
    );
  });

  it('should retrieve the default plan for collectivite #2 ', async () => {
    const results = await planActionReadEndpoint.getBy({
      collectivite_id: 2,
    });
    expect(results.length).toEqual(1);
  });
});
