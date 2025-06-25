'use client';

import Arborescence from './DragAndDropNestedContainers/Arborescence';

import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import { AxeActions } from '@/app/plans/plans/detailed-plan-action-view/AxeActions';
import { TPlanType } from '@/app/types/alias';
import ScrollTopButton from '@/app/ui/buttons/ScrollTopButton';
import { Spacer } from '@/ui/design-system/Spacer';
import { VisibleWhen } from '@/ui/design-system/VisibleWhen';
import { PlanNode } from '../types';
import { checkAxeHasFiche } from '../utils';
import { usePlanAction } from './data/use-fetch-plan-action';
import { FiltresMenuButton } from './Filtres';
import { usePlanActionFilters } from './Filtres/context/PlanActionFiltersContext';
import { FilteredResults } from './Filtres/FilteredResults';
import { Header } from './Header';

const PlanActionContent = ({
  children,
  currentCollectivite,
  rootAxe,
  axe,
  axeHasFiche,
}: {
  children: React.ReactNode;
  currentCollectivite: CurrentCollectivite;
  rootAxe: PlanNode;
  axe: PlanNode;
  axeHasFiche: boolean;
}) => {
  return (
    <div className="bg-white rounded-md p-4">
      <div className="flex items-center justify-between">
        <div className="text-lg text-primary-9 font-bold">
          Liste des actions
        </div>
        <div className="flex items-center align-middle gap-4">
          <VisibleWhen condition={currentCollectivite.isReadOnly === false}>
            <AxeActions
              plan={rootAxe}
              axe={axe}
              collectiviteId={currentCollectivite.collectiviteId}
            />
          </VisibleWhen>
          <VisibleWhen condition={axeHasFiche}>
            <FiltresMenuButton />
          </VisibleWhen>
        </div>
      </div>
      {children}
    </div>
  );
};

type Props = {
  currentCollectivite: CurrentCollectivite;
  /** Axe racine du plan d'action (depth = 0) */
  rootAxe: PlanNode;
  /** La liste des axes liés à ce plan d'action */
  axes: PlanNode[];
  /** Type du plan d'action */
  planType: TPlanType | null;
};

export const PlanActionView = ({
  rootAxe,
  axes: initialAxes,
  currentCollectivite,
  planType,
}: Props) => {
  const { isFiltered } = usePlanActionFilters();
  const axes = usePlanAction(rootAxe.id, {
    initialData: initialAxes,
  });

  const axe = axes.find((a) => a.id === rootAxe.id);
  if (!axe) {
    return <div>Axe non trouvé</div>;
  }

  const axeHasFiche = checkAxeHasFiche(axe, axes);

  return (
    <div data-test="PlanAction" className="w-full">
      <Header
        collectivite={currentCollectivite}
        plan={rootAxe}
        axe={axe}
        axes={axes}
        axeHasFiches={axeHasFiche}
        planType={planType}
      />
      <Spacer height={4} />
      <PlanActionContent
        currentCollectivite={currentCollectivite}
        rootAxe={rootAxe}
        axe={axe}
        axeHasFiche={axeHasFiche}
      >
        <VisibleWhen condition={!isFiltered}>
          <Arborescence
            plan={rootAxe}
            axe={axe}
            axes={axes}
            collectivite={currentCollectivite}
          />
        </VisibleWhen>
        <VisibleWhen condition={isFiltered}>
          <FilteredResults
            collectivite={currentCollectivite}
            planId={rootAxe.id.toString()}
          />
        </VisibleWhen>
      </PlanActionContent>
      <Spacer height={12} />
      <ScrollTopButton />
      <Spacer height={12} />
    </div>
  );
};
