import '@testing-library/jest-dom/extend-expect';
import {PlanActionReadEndpoint} from 'core-logic/api/endpoints/PlanActionReadEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';
import {yuluCredentials} from 'test_utils/collectivites';

describe('Plan action reading endpoint ', () => {
  it('should not be able to read if not connected', async () => {
    const planActionReadEndpoint = new PlanActionReadEndpoint([]);

    const results = await planActionReadEndpoint.getBy({
      collectivite_id: 1,
    });

    expect(results).toHaveLength(0);
  });
  it('should retrieve data-layer fake plan for collectivite #1  (for anyone connected)', async () => {
    const planActionReadEndpoint = new PlanActionReadEndpoint([]);
    await supabaseClient.auth.signIn(yuluCredentials); // Yulu has no rights on collectivite #1

    const results = await planActionReadEndpoint.getBy({
      collectivite_id: 1,
    });

    expect(results.length).toBeGreaterThanOrEqual(1);
    const partialExpectedFakePlanAction = {
      collectivite_id: 1,
      nom: "Plan d'action de la collectivité",
    };

    const partialExpectedDefaultPlanAction = {
      collectivite_id: 1,
      nom: "Plan d'action de la collectivité",
    };

    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining(partialExpectedFakePlanAction),
        expect.objectContaining(partialExpectedDefaultPlanAction),
      ])
    );
  });
});
