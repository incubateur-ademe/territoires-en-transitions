import {getFicheActionStoreForEpci} from 'core-logic/api/hybridStores';
import * as R from 'ramda';
import {useEffect, useState} from 'react';
import {FicheActionStorable} from 'storables/FicheActionStorable';
import {Avancement, FicheActionAvancement} from 'types';
import {
  PlanActionStructure,
  PlanActionTyped,
} from 'types/PlanActionTypedInterface';

export type PlanActionAvancementSummmary = {
  avancementsCount?: Partial<Record<FicheActionAvancement, number>>;
  enRetardCount: number;
  total: number;
};

const storablesToState = (
  ficheActions: FicheActionStorable[]
): PlanActionAvancementSummmary => {
  const avancementsCount = R.countBy(
    ficheAction => ficheAction.avancement,
    ficheActions
  ) as Partial<Record<Avancement, number>>; // TODO : infer type with Ramda

  const enRetardCount = ficheActions.filter(
    ficheAction => ficheAction.en_retard
  ).length;
  const total = ficheActions.length;
  return {avancementsCount, enRetardCount, total};
};

export const useEpciPlanActionAvancementSummmary = (
  plan: PlanActionTyped
): PlanActionAvancementSummmary => {
  const [
    epciPlanActionAvancementSummmary,
    setEpciPlanActionAvancementSummmary,
  ] = useState<PlanActionAvancementSummmary>({enRetardCount: 0, total: 0});
  const planFicheUids = (plan as PlanActionStructure).fiches_by_category.map(
    fc => fc.fiche_uid
  );
  const fichesOfPlan = (fiches: FicheActionStorable[]) =>
    fiches.filter(fiche => planFicheUids.includes(fiche.uid));

  useEffect(() => {
    const store = getFicheActionStoreForEpci(plan.epci_id);
    const listener = async () => {
      const fiches = await store.retrieveAll();
      const planFiches = fichesOfPlan(fiches);
      setEpciPlanActionAvancementSummmary(storablesToState(planFiches));
    };

    store.retrieveAll().then(fiches => {
      const planFiches = fichesOfPlan(fiches);
      const newState = storablesToState(planFiches);
      if (
        JSON.stringify(newState) !==
        JSON.stringify(epciPlanActionAvancementSummmary)
      ) {
        setEpciPlanActionAvancementSummmary(newState);
      }
    });
    store.addListener(listener);
    return () => {
      store.removeListener(listener);
    };
  }, [epciPlanActionAvancementSummmary]);

  return epciPlanActionAvancementSummmary;
};
