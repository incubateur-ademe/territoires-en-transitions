import '@testing-library/jest-dom/extend-expect';
import {
  planActionWriteEndpoint,
  PlanActionWriteEndpoint,
} from 'core-logic/api/endpoints/PlanActionWriteEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';
import {PlanActionWrite} from 'generated/dataLayer/plan_action_write';
import {yiliCredentials} from 'test_utils/collectivites';

describe('Plan action write endpoint', () => {
  beforeEach(async () => {
    await supabaseClient.auth.signInWithPassword(yiliCredentials);
  });

  it('Should be able to save and update a plan', async () => {
    const plan: PlanActionWrite = {
      collectivite_id: 2,
      uid: 'f000cf22-e00f-4457-a312-d91a796df993',
      nom: "plan d'action de la collectivité",
      categories: [
        {
          nom: '1. Yolo',
          uid: 'ef599348-6ab9-4dc7-bf62-41b9a17ea5fa',
        },
      ],
      fiches_by_category: [
        {
          fiche_uid: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
          category_uid: 'ef599348-6ab9-4dc7-bf62-41b9a17ea5fa',
        },
      ],
    };
    // 1. Create
    const creationResult = await planActionWriteEndpoint.save(plan);
    expect(creationResult).not.toBeNull();
    expect(creationResult).toEqual(expect.objectContaining(plan));
    // 2. Update
    const updatedPlan = {...plan, nom: 'Nouveau nom'};
    const updateResult = await planActionWriteEndpoint.save(updatedPlan);
    expect(updateResult).not.toBeNull();
    expect(updateResult).toEqual(expect.objectContaining(updatedPlan));
  });

  it('Should fail when collectivite is readonly', async () => {
    const endpoint = new PlanActionWriteEndpoint();
    const plan: PlanActionWrite = {
      collectivite_id: 8, // Yili has no right in collectivite #8
      uid: 'f111cf22-e00f-4457-a312-d91a796df993',
      nom: "plan d'action de la collectivité",
      categories: [],
      fiches_by_category: [],
    };
    const result = await endpoint.save(plan);
    expect(endpoint.lastResponse?.status).toBe(403);
    expect(result).toEqual(null);
  });
});
