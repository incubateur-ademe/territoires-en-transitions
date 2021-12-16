import '@testing-library/jest-dom/extend-expect';
import {planActionReadEndpoint} from 'core-logic/api/endpoints/PlanActionReadEndpoint';

describe('Plan action reading endpoint ', () => {
  it('should retrieve data-layer default plan for collectivite #1 ', async () => {
    const results = await planActionReadEndpoint.getBy({
      collectivite_id: 1,
    });

    expect(results.length).toBeGreaterThanOrEqual(1);
    const partialExpectedReadPlanAction = {
      id: 1,
      collectivite_id: 1,
      uid: 'plan_collectivite',
    };
    expect(results[0]).toEqual(
      expect.objectContaining(partialExpectedReadPlanAction)
    );
  });
  it('should retrieve 0 plans for collectivite #2 ', async () => {
    const results = await planActionReadEndpoint.getBy({
      collectivite_id: 2,
    });
    expect(results.length).toEqual(0);
  });
});
