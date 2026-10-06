import { appLabels } from '@/app/labels/catalog';
import { PlanListItem } from '@/app/plans/plans/list-all-plans/data/use-list-plans';
import { generateTitle } from '@/app/utils/generate-title';
import { MenuAction, SplitButton } from '@tet/ui';
import { JSX } from 'react';

export type PlanTarget = {
  planId: number;
  planNom: string;
};

type AddToPlanSplitButtonProps = {
  firstPlan: PlanListItem;
  isAdding: boolean;
  plans: PlanListItem[];
  onAddToPlan: (target: PlanTarget) => void;
};

const toPlanDetails = (plan: PlanListItem): string =>
  [
    plan.type?.type,
    ...plan.pilotes.map((pilote) => pilote.userName ?? pilote.tagName),
  ]
    .filter((detail) => detail !== undefined && detail !== null)
    .join(' · ');

const PlanMenuEntry = ({ plan }: { plan: PlanListItem }): JSX.Element => (
  <span className="flex flex-col gap-0.5 text-left">
    <span className="font-bold text-primary-9">{generateTitle(plan.nom)}</span>
    <span className="text-xs font-normal text-grey-8">
      {toPlanDetails(plan)}
    </span>
  </span>
);

const toPlanTarget = (plan: PlanListItem): PlanTarget => ({
  planId: plan.id,
  planNom: generateTitle(plan.nom),
});

const toMenuAction = (
  plan: PlanListItem,
  onAddToPlan: (target: PlanTarget) => void
): MenuAction => ({
  label: <PlanMenuEntry plan={plan} />,
  onClick: () => onAddToPlan(toPlanTarget(plan)),
});

export const AddToPlanSplitButton = ({
  firstPlan,
  isAdding,
  plans,
  onAddToPlan,
}: AddToPlanSplitButtonProps): JSX.Element => (
  <SplitButton
    variant="outlined"
    size="xs"
    disabled={isAdding}
    onClick={() => onAddToPlan(toPlanTarget(firstPlan))}
    menuActions={plans.map((plan) => toMenuAction(plan, onAddToPlan))}
    menuPlacement="bottom-start"
  >
    {appLabels.ajouterAuPlan(generateTitle(firstPlan.nom))}
  </SplitButton>
);
