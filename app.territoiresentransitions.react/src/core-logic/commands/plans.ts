import {planActionStore} from 'core-logic/api/hybridStores';
import {PlanActionStorable} from 'storables/PlanActionStorable';
import {v4 as uuid} from 'uuid';
import {FicheActionFormData} from 'app/pages/collectivite/PlanActions/Forms/FicheActionForm';
import {PlanActionStructure} from 'types/PlanActionTypedInterface';

const createPlanAction = async (epci_id: string, nom: string) => {
  await planActionStore.store(
    new PlanActionStorable({
      epci_id,
      nom,
      uid: uuid(),
      fiches_by_category: [],
      categories: [],
    })
  );
};

export const plans = {
  createPlanAction,
};

/**
 * When a fiche is saved, update plans.
 *
 * @param data the data from FicheActionForm
 */
export const updatePlansOnFicheSave = async (data: FicheActionFormData) => {
  const plans = await planActionStore.retrieveAll();
  const ficheUid = data.uid;
  const planCategories = data.planCategories;

  // For every plan, if a plan/categorie is attached: update then save plan.
  for (const plan of plans) {
    const planCategorie = planCategories.find(c => c.planUid === plan.uid);
    if (planCategorie !== undefined) {
      const fichesByCategories = (
        plan as PlanActionStructure
      ).fiches_by_category.filter(fc => fc.fiche_uid !== ficheUid);
      fichesByCategories.push({
        category_uid: planCategorie.categorieUid,
        fiche_uid: ficheUid,
      });
      plan.fiches_by_category = fichesByCategories;
      await planActionStore.store(plan);
    }
  }
};
