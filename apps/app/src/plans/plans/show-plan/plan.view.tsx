'use client';

import { EmptyPlanView } from '@/app/plans/plans/show-plan/empty-plan.view';
import {
  PlanAxesProvider,
  usePlanAxesContext,
} from '@/app/plans/plans/show-plan/plan-arborescence.view/plan-axes.context';
import ScrollTopButton from '@/app/ui/buttons/ScrollTopButton';
import { useUser } from '@tet/api';
import { Plan } from '@tet/domain/plans';
import { Button, Spacer, VisibleWhen } from '@tet/ui';
import { CompletionAlert } from './completion/completion.alert';
import { ContentPanelWithHeader } from './content-panel-with-header';
import { useGetPlan } from './data/use-get-plan';
import { EditPlanButtons } from './edit-plan.buttons';
import { FiltersMenuButton } from './filters';
import { FilteredResults } from './filters/filtered-results';
import { PlanOptionsButton } from './plan-arborescence.view/plan-options.button';
import { PlanTree } from './plan-arborescence.view/plan-tree';
import { PlanHeader } from './plan.header';

type Props = {
  plan: Plan;
};

export const PlanView = ({ plan: initialPlanData }: Props) => {
  const plan = useGetPlan(initialPlanData.id, {
    initialData: initialPlanData,
  });
  const rootAxe = plan?.axes.find((axe) => axe.parent === null);

  if (!plan || !rootAxe) {
    return <div>Plan non trouvé</div>;
  }

  return (
    <PlanAxesProvider plan={plan} rootAxe={rootAxe}>
      <PlanViewContent />
    </PlanAxesProvider>
  );
};

const PlanViewContent = () => {
  const {
    collectivite,
    canEditPlan,
    areAllClosed,
    toggleAll,
    isActionsVisible,
    plan,
    rootAxe,
    axeHasFiches,
    hasAxesToExpand,
    isPlanEmpty,
    isFiltered,
  } = usePlanAxesContext();
  const user = useUser();

  return (
    <div className="w-full">
      <PlanHeader />
      <Spacer height={2} />

      <CompletionAlert
        collectiviteId={collectivite.collectiviteId}
        planId={plan.id}
      />

      <VisibleWhen condition={isPlanEmpty}>
        <div className="h-[50vh]">
          <EmptyPlanView currentCollectivite={collectivite} plan={rootAxe} />
        </div>
      </VisibleWhen>
      <VisibleWhen condition={!isPlanEmpty}>
        <ContentPanelWithHeader
          headerActionButtonsLeft={
            <>
              <PlanOptionsButton />
              <VisibleWhen condition={hasAxesToExpand && !isFiltered}>
                <Button
                  size="xs"
                  variant="outlined"
                  icon={areAllClosed ? 'arrow-down-line' : 'arrow-up-line'}
                  iconPosition="right"
                  onClick={toggleAll}
                  dataTest="ToggleAllAxes"
                >
                  {areAllClosed
                    ? 'Ouvrir tous les axes/sous-axes'
                    : 'Fermer tous les axes/sous-axes'}
                </Button>
              </VisibleWhen>
            </>
          }
          headerActionButtonsRight={
            <div className="flex gap-6">
              <VisibleWhen condition={canEditPlan}>
                <EditPlanButtons
                  plan={rootAxe}
                  collectiviteId={collectivite.collectiviteId}
                  isActionsVisible={isActionsVisible}
                  availableActions={
                    isFiltered
                      ? ['createFicheResume']
                      : ['addAxe', 'createFicheResume']
                  }
                />
              </VisibleWhen>
              <VisibleWhen condition={axeHasFiches}>
                <FiltersMenuButton />
              </VisibleWhen>
            </div>
          }
        >
          <VisibleWhen condition={!isFiltered}>
            <PlanTree
              plan={rootAxe}
              axes={plan.axes}
              collectivite={collectivite}
            />
          </VisibleWhen>
          <VisibleWhen condition={isFiltered}>
            <FilteredResults
              collectivite={collectivite}
              currentUserId={user.id}
            />
          </VisibleWhen>
        </ContentPanelWithHeader>
        <Spacer height={2} />
        <ScrollTopButton />
      </VisibleWhen>
    </div>
  );
};
