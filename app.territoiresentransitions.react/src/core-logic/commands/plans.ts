import {v4 as uuid} from 'uuid';
import {FicheActionFormData} from 'app/pages/collectivite/PlanActions/Forms/FicheActionForm';
import {PlanActionStructure} from 'types/PlanActionTypedInterface';
import {planActionRepository} from 'core-logic/api/repositories/PlanActionRepository';

const createPlanAction = async (collectivite_id: number, nom: string) => {
  await planActionRepository.save({
    collectivite_id,
    nom,
    uid: uuid(),
    fiches_by_category: [],
    categories: [],
  });
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
  const plans = await planActionRepository.fetchCollectivitePlanActionList({
    collectiviteId: data.collectivite_id,
  });
  const ficheUid = data.uid;
  const planCategories = data.planCategories;

  // For each plan, update the attached fiches
  for (const plan of plans) {
    const planCategorie = planCategories.find(c => c.planUid === plan.uid);
    const fichesByCategories = (
      plan as PlanActionStructure
    ).fiches_by_category.filter(fc => fc.fiche_uid !== ficheUid);
    if (planCategorie) {
      fichesByCategories.push({
        category_uid: planCategorie.categorieUid,
        fiche_uid: ficheUid,
      });
    }
    plan.fiches_by_category = fichesByCategories;
    await planActionRepository.save(plan);
  }
};
