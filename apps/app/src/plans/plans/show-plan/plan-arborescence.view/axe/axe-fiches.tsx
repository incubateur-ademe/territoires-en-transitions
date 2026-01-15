import { useListFiches } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { FichesList } from '../fiches.list';
import { PlanDisplayOptionsEnum } from '../plan-options.context';
import { AxeSectionTitle } from './axe-section-title';
import { useAxeContext } from './axe.context';

export const AxeFiches = () => {
  const { planOptions, isOpen, providerProps } = useAxeContext();
  const { axe, collectivite, rootAxe } = providerProps;
  const isEnabled =
    isOpen && planOptions.isOptionEnabled(PlanDisplayOptionsEnum.ACTIONS);

  const { count, isLoading } = useListFiches(
    collectivite.collectiviteId,
    {
      filters: { axesId: [axe.id] },
      queryOptions: { limit: 1 },
    },
    isEnabled
  );

  if (!isEnabled || (!isLoading && !count)) {
    return null;
  }

  return (
    <section>
      {!isLoading && <AxeSectionTitle name="fiches" />}
      <FichesList
        collectivite={collectivite}
        ficheIds={axe.fiches}
        axeId={axe.id}
        planId={rootAxe.id}
      />
    </section>
  );
};
