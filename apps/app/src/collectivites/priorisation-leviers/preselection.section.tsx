import { appLabels } from '@/app/labels/catalog';
import {
  PlanListItem,
  useListPlans,
} from '@/app/plans/plans/list-all-plans/data/use-list-plans';
import PictoDashboard from '@/app/ui/pictogrammes/PictoDashboard';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import type { ActionDeReference } from '@tet/domain/shared';
import { Button, EmptyCard, Icon, VisibleWhen } from '@tet/ui';
import { JSX, ReactNode } from 'react';
import { ActionDeReferenceSummaryCard } from './action-de-reference-summary.card';
import { AddToPlanSplitButton } from './add-to-plan.split-button';
import {
  ActionsDeReferencePlanAdditions,
  useActionsDeReferencePlanAdditions,
} from './data/use-actions-de-reference-plan-additions';
import { LevierCardInfo } from './levier-card-info';
import {
  PreselectionFilters,
  usePreselectionFiltering,
} from './preselection.filters';
import { ActionAddedToPlan, Preselection } from './use-preselection';

type PreselectionSectionProps = {
  preselection: Preselection;
};

type PreselectedActionCardProps = {
  action: ActionDeReference;
  plans: PlanListItem[];
  preselection: Preselection;
  planAdditions: ActionsDeReferencePlanAdditions;
};

type AddedToPlanFooterProps = {
  addedToPlan: ActionAddedToPlan;
  onUndo: () => void;
};

const EmptyPreselection = (): JSX.Element => (
  <EmptyCard
    picto={(props) => <PictoDashboard {...props} />}
    title={appLabels.preselectionVide}
    description={appLabels.preselectionVideDescription}
    size="xs"
  />
);

const AddedToPlanFooter = ({
  addedToPlan,
  onUndo,
}: AddedToPlanFooterProps): JSX.Element => (
  <>
    <span className="flex items-center gap-1 text-sm font-bold text-success-1">
      <Icon icon="check-line" size="sm" aria-hidden />
      {appLabels.ajouteAuPlan(addedToPlan.planNom)}
    </span>
    <Button size="xs" variant="underlined" onClick={onUndo}>
      {appLabels.annulerAjoutAuPlan}
    </Button>
  </>
);

const PreselectionTitle = ({
  children,
}: {
  children: ReactNode;
}): JSX.Element => <h2 className="mb-0 text-2xl">{children}</h2>;

const PreselectedActionCard = ({
  action,
  plans,
  preselection,
  planAdditions,
}: PreselectedActionCardProps): JSX.Element => {
  const addedToPlan = preselection.addedToPlanOf(action.id);
  const [firstPlan] = plans;
  const hasPlan = firstPlan !== undefined;
  return (
    <ActionDeReferenceSummaryCard action={action}>
      {addedToPlan ? (
        <AddedToPlanFooter
          addedToPlan={addedToPlan}
          onUndo={() => planAdditions.undo(action.id)}
        />
      ) : (
        <>
          {hasPlan && (
            <AddToPlanSplitButton
              firstPlan={firstPlan}
              isAdding={planAdditions.isAdding(action.id)}
              plans={plans}
              onAddToPlan={(target) => planAdditions.add({ action, ...target })}
            />
          )}
          <Button
            size="xs"
            variant="underlined"
            onClick={() => preselection.remove(action.id)}
          >
            {appLabels.retirerDeLaPreselection}
          </Button>
        </>
      )}
    </ActionDeReferenceSummaryCard>
  );
};

const PreselectionList = ({
  preselection,
}: PreselectionSectionProps): JSX.Element => {
  const planAdditions = useActionsDeReferencePlanAdditions(preselection);
  const filtering = usePreselectionFiltering(preselection.actions);
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();
  const { plans } = useListPlans(collectiviteId, {
    sort: { field: 'nom', direction: 'asc' },
  });
  const canAddToPlan = hasCollectivitePermission('plans.fiches.create');
  const addablePlans = canAddToPlan ? plans : [];
  const hasNoMatch = filtering.filteredActions.length === 0;
  return (
    <div className="flex flex-col gap-4">
      <PreselectionFilters
        actions={preselection.actions}
        filtering={filtering}
      />
      <VisibleWhen condition={hasNoMatch}>
        <LevierCardInfo>{appLabels.actionsDeReferenceAucune}</LevierCardInfo>
      </VisibleWhen>
      <ul
        role="list"
        className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3"
      >
        {filtering.filteredActions.map((action) => (
          <li key={action.id} className="p-0">
            <PreselectedActionCard
              action={action}
              plans={addablePlans}
              preselection={preselection}
              planAdditions={planAdditions}
            />
          </li>
        ))}
      </ul>
      <LevierCardInfo>{appLabels.actionAjouteeAuPlanInfo}</LevierCardInfo>
    </div>
  );
};

export const PreselectionSection = ({
  preselection,
}: PreselectionSectionProps): JSX.Element => {
  const isPreselectionEmpty = preselection.actions.length === 0;
  return (
    <section className="flex flex-col gap-4">
      <PreselectionTitle>{appLabels.votrePreselection}</PreselectionTitle>
      {isPreselectionEmpty ? (
        <EmptyPreselection />
      ) : (
        <PreselectionList preselection={preselection} />
      )}
    </section>
  );
};
