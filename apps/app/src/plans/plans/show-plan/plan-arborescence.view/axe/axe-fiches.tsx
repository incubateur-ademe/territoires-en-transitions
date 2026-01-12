import { FichesList } from '../fiches.list';
import { PlanDisplayOptionsEnum } from '../plan-options.context';
import { AxeSectionTitle } from './axe-section-title';
import { useAxeContext } from './axe.context';

export const AxeFiches = () => {
  const { planOptions, isOpen, providerProps } = useAxeContext();
  const { axe, collectivite, rootAxe } = providerProps;
  const isEnabled =
    isOpen && planOptions.isOptionEnabled(PlanDisplayOptionsEnum.ACTIONS);

  if (!isEnabled) {
    return null;
  }

  return (
    <section>
      <AxeSectionTitle name="fiches" />
      <FichesList
        collectivite={collectivite}
        ficheIds={axe.fiches}
        axeId={axe.id}
        planId={rootAxe.id}
      />
    </section>
  );
};
