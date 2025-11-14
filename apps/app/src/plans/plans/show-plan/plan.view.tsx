'use client';

import { useCurrentCollectivite } from '@/api/collectivites';
import { useUser } from '@/api/users';
import { PiloteOrReferentLabel } from '@/app/plans/plans/components/PiloteOrReferentLabel';
import { EmptyPlanView } from '@/app/plans/plans/show-plan/empty-plan.view';
import { usePlanFilters } from '@/app/plans/plans/show-plan/filters/plan-filters.context';
import { PlanArborescence } from '@/app/plans/plans/show-plan/plan-arborescence.view';
import ScrollTopButton from '@/app/ui/buttons/ScrollTopButton';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { Plan } from '@/domain/plans';
import { Spacer, VisibleWhen } from '@/ui';
import { Header } from '../components/header';
import { checkAxeHasFiche } from '../utils';
import { Actions } from './actions';
import { CompletionAlert } from './completion/completion.alert';
import { ContentPanelWithHeader } from './content-panel-with-header';
import { useGetPlan } from './data/use-get-plan';
import { EditPlanButtons } from './edit-plan.buttons';
import { FiltersMenuButton } from './filters';
import { FilteredResults } from './filters/filtered-results';
import { PlanStatus } from './plan-status.chart';

const PlanMetadata = ({ plan }: { plan: Plan }) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm uppercase text-grey-8 font-normal">
        {plan.type?.type || 'Sans type'}
      </span>
      <VisibleWhen condition={plan.pilotes.length > 0}>
        <div className="border-l-2 border-gray-200 px-2">
          <PiloteOrReferentLabel icon="pilote" personnes={plan.pilotes} />
        </div>
      </VisibleWhen>
      <VisibleWhen condition={plan.referents.length > 0}>
        <div className="border-l-2 border-gray-200 px-2">
          <PiloteOrReferentLabel icon="france" personnes={plan.referents} />
        </div>
      </VisibleWhen>
    </div>
  );
};

type Props = {
  plan: Plan;
};

export const PlanView = ({ plan: initialPlanData }: Props) => {
  const currentCollectivite = useCurrentCollectivite();
  const user = useUser();

  const { isFiltered } = usePlanFilters();
  const plan = useGetPlan(initialPlanData.id, {
    initialData: initialPlanData,
  });
  const rootAxe = plan.axes.find((axe) => axe.parent === null);
  if (!rootAxe) {
    return <div>Plan non trouvé</div>;
  }
  const axeHasFiches = rootAxe ? checkAxeHasFiche(rootAxe, plan.axes) : false;

  const planNameOrFallback = rootAxe?.nom ?? 'Sans titre';

  const hasFiches = rootAxe.fiches && rootAxe.fiches.length > 0;
  const hasAxes = plan.axes.some((axe) => axe.depth > 0);
  const isPlanEmpty = !hasFiches && !hasAxes;
  return (
    <div className="w-full">
      <Header
        title={planNameOrFallback}
        actionButtons={
          <VisibleWhen condition={currentCollectivite.isReadOnly === false}>
            <Actions plan={plan} axeHasFiches={axeHasFiches} />
          </VisibleWhen>
        }
      >
        <div className="flex flex-col gap-2 grow">
          <PlanMetadata plan={plan} />

          <PlanStatus planId={plan.id} />
        </div>
      </Header>
      <Spacer height={2} />

      <CompletionAlert
        collectiviteId={currentCollectivite.collectiviteId}
        planId={plan.id}
      />

      <VisibleWhen condition={isPlanEmpty}>
        <div className="h-[50vh]">
          <EmptyPlanView
            currentCollectivite={currentCollectivite}
            plan={rootAxe}
          />
        </div>
      </VisibleWhen>
      <VisibleWhen condition={!isPlanEmpty}>
        <ContentPanelWithHeader
          title="Détail du plan"
          headerActionButtons={
            <>
              <VisibleWhen
                condition={
                  currentCollectivite.isReadOnly === false &&
                  hasPermission(currentCollectivite.permissions, 'plans.mutate')
                }
              >
                <EditPlanButtons
                  plan={rootAxe}
                  collectiviteId={currentCollectivite.collectiviteId}
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
            </>
          }
        >
          <VisibleWhen condition={!isFiltered}>
            <PlanArborescence
              plan={rootAxe}
              axes={plan.axes}
              collectivite={currentCollectivite}
            />
          </VisibleWhen>
          <VisibleWhen condition={isFiltered}>
            <FilteredResults
              collectivite={currentCollectivite}
              planId={rootAxe.id}
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
