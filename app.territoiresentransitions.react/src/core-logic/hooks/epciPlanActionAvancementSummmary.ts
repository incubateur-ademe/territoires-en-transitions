import {getFicheActionStoreForEpci} from 'core-logic/api/hybridStores';
import * as R from 'ramda';
import {useEffect, useState} from 'react';
import {FicheActionStorable} from 'storables/FicheActionStorable';
import {Avancement, FicheActionAvancement} from 'types';

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
  epciId: string
): PlanActionAvancementSummmary => {
  const [
    epciPlanActionAvancementSummmary,
    setEpciPlanActionAvancementSummmary,
  ] = useState<PlanActionAvancementSummmary>({enRetardCount: 0, total: 0});

  useEffect(() => {
    console.log('useEpciPlanActionAvancementSummmary useEffect ');

    const store = getFicheActionStoreForEpci(epciId);
    const listener = async () => {
      const ficheActions = await store.retrieveAll();
      setEpciPlanActionAvancementSummmary(storablesToState(ficheActions));
    };

    store.retrieveAll().then(storables => {
      const newState = storablesToState(storables);
      if (
        JSON.stringify(newState) !==
        JSON.stringify(epciPlanActionAvancementSummmary)
      ) {
        console.log('setEpciPlanActionAvancementSummmary ');
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
