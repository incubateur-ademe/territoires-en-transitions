import '@testing-library/jest-dom/extend-expect';
import {PlanActionWriteEndpoint} from 'core-logic/api/endpoints/PlanActionWriteEndpoint';
import {supabase} from 'core-logic/api/supabase';
import {PlanActionWrite} from 'generated/dataLayer/plan_action_write';
import {yiliCredentials} from 'test_utils/collectivites';

describe('Plan action write endpoint', () => {
  beforeEach(async () => {
    await supabase.auth.signIn(yiliCredentials);
  });

  it('Should return an equivalent plan when saving a plan ', async () => {
    const endpoint = new PlanActionWriteEndpoint();
    const plan: PlanActionWrite = {
      collectivite_id: 1,
      uid: 'plan_collectivite',
      nom: "Plan d'actions de la collectivité",
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
    const actualCommentaireWrite = await endpoint.save(plan);
    expect(actualCommentaireWrite).not.toBeNull();
  });

  it('Should fail when saving a commentaire with bad epci', async () => {
    const endpoint = new PlanActionWriteEndpoint();
    const plan: PlanActionWrite = {
      collectivite_id: 10000,
      uid: 'plan_collectivite',
      nom: "Plan d'actions de la collectivité",
      categories: [],
      fiches_by_category: [],
    };
    const result = await endpoint.save(plan);
    expect(result).toEqual(null);
  });
});
