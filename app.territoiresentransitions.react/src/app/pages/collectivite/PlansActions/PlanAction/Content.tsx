'use client';

import Arborescence from './DragAndDropNestedContainers/Arborescence';
import PlanActionFooter from './PlanActionFooter';

import { CollectiviteNiveauAcces } from '@/api/collectivites/fetch-collectivite-niveau-acces';
import { AxeActions } from '@/app/app/pages/collectivite/PlansActions/PlanAction/AxeActions';
import { makeCollectivitePlanActionUrl } from '@/app/app/paths';
import { TPlanType } from '@/app/types/alias';
import { Breadcrumbs } from '@/ui';
import { Spacer } from '@/ui/design-system/Spacer';
import { VisibleWhen } from '@/ui/design-system/VisibleWhen';
import { useRouter } from 'next/navigation';
import { usePlanAction } from './data/server-actions/use-fetch-plan-action';
import { PlanNode } from './data/types';
import { checkAxeHasFiche } from './data/utils';
import { FiltresMenuButton } from './Filtres';
import { usePlanActionFilters } from './Filtres/context/PlanActionFiltersContext';
import FilteredResults from './Filtres/FilteredResults';
import { Header } from './Header';

type Props = {
  currentCollectivite: CollectiviteNiveauAcces;
  /** Axe racine du plan d'action (depth = 0) */
  rootAxe: PlanNode;
  /** La liste des axes liés à ce plan d'action */
  axes: PlanNode[];
  /** Type du plan d'action */
  planType: TPlanType | null;
  viewMode: 'axe' | 'plan';
};

export const Content = ({
  rootAxe,
  axes: initialAxes,
  currentCollectivite,
  planType,
  viewMode,
}: Props) => {
  const router = useRouter();
  const { filters, isFiltered } = usePlanActionFilters();
  const axes = usePlanAction(rootAxe.id, {
    initialData: initialAxes,
  });

  const axe = axes.find((a) => a.id === rootAxe.id);
  if (!axe) {
    return <div>Axe non trouvé</div>;
  }
  // Permet de différentier une page axe d'une page plan
  const isAxePage = viewMode === 'axe';

  const axeHasFiche = checkAxeHasFiche(axe, axes);

  return (
    <div data-test={isAxePage ? 'PageAxe' : 'PlanAction'} className="w-full">
      <Header
        collectivite={currentCollectivite}
        plan={rootAxe}
        axe={axe}
        axes={axes}
        isAxePage={isAxePage}
        axeHasFiches={axeHasFiche}
        planType={planType}
      />
      <Spacer height={4} />
      <FicheActionsListPanel
        currentCollectivite={currentCollectivite}
        rootAxe={rootAxe}
        axe={axe}
        isAxePage={isAxePage}
        axeHasFiche={axeHasFiche}
      >
        <VisibleWhen condition={isAxePage}>
          <div className="py-6">
            <Breadcrumbs
              size="xs"
              items={[
                {
                  label: rootAxe.nom,
                  onClick: () =>
                    router.push(
                      makeCollectivitePlanActionUrl({
                        collectiviteId: currentCollectivite.collectiviteId,
                        planActionUid: axe.id.toString(),
                      })
                    ),
                },
                { label: axe.nom },
              ]}
            />
          </div>
        </VisibleWhen>

        <VisibleWhen condition={!isFiltered}>
          <Arborescence
            isReadOnly={currentCollectivite.isReadOnly}
            plan={rootAxe}
            axe={axe}
            axes={axes}
            isAxePage={isAxePage}
            collectivite={currentCollectivite}
          />
        </VisibleWhen>

        <VisibleWhen condition={isFiltered}>
          <FilteredResults
            collectivite={currentCollectivite}
            planId={rootAxe.id.toString()}
          />
        </VisibleWhen>

        <PlanActionFooter />
      </FicheActionsListPanel>
    </div>
  );
};

const FicheActionsListPanel = ({
  children,
  currentCollectivite,
  rootAxe,
  axe,
  isAxePage,
  axeHasFiche,
}: {
  children: React.ReactNode;
  currentCollectivite: CollectiviteNiveauAcces;
  rootAxe: PlanNode;
  axe: PlanNode;
  isAxePage: boolean;
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
            <FiltresMenuButton
              currentPlan={rootAxe}
              axe={axe}
              isAxePage={isAxePage}
              collectivite={currentCollectivite}
            />
          </VisibleWhen>
        </div>
      </div>
      {children}
    </div>
  );
};
