import { FicheWithRelations } from '@tet/domain/plans';
import { Button, VisibleWhen } from '@tet/ui';
import { JSX, useState } from 'react';
import { Breadcrumbs as BasicBreadcrumbs } from './basic-breadcrumbs';

type Axe = Pick<
  NonNullable<FicheWithRelations['axes']>[number],
  'id' | 'planId' | 'collectiviteId'
>;

type FichesBreadcrumbsProps = {
  title: string;
  collectiviteId: number;
  axes: Axe[];
  planId?: number;
};

const OtherPlansBreadcrumbs = ({
  plans,
  title,
  collectiviteId,
}: {
  plans: Axe[];
  title: string;
  collectiviteId: number;
}): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const plansCount = plans.length;
  const s = plansCount > 1 ? 's' : '';
  return (
    <div className="mt-1 flex flex-col gap-2">
      <Button
        variant="underlined"
        size="sm"
        icon={isOpen ? 'arrow-up-s-line' : 'arrow-down-s-line'}
        iconPosition="right"
        onClick={() => setIsOpen((prevState) => !prevState)}
      >
        {plansCount > 1 ? plansCount : ''} autre{s} emplacement{s} pour cette
        action{s}
      </Button>

      <VisibleWhen condition={isOpen}>
        {plans.map((plan, index) => (
          <BasicBreadcrumbs
            key={index}
            title={title}
            planId={plan.id}
            collectiviteId={collectiviteId}
          />
        ))}
      </VisibleWhen>
    </div>
  );
};

export const Breadcrumbs = ({
  title,
  collectiviteId,
  axes,
  planId,
}: FichesBreadcrumbsProps) => {
  const plansWhereFicheIsLocated = axes.filter(
    (axe) => axe.collectiviteId === collectiviteId
  );

  const currentPlanAxe = plansWhereFicheIsLocated.find(
    (axe) => axe.planId === planId
  );
  const otherPlansWhereFicheIsLocated = plansWhereFicheIsLocated.filter(
    (axe) => axe.id !== currentPlanAxe?.id
  );

  const plansToDisplay = [
    currentPlanAxe,
    ...otherPlansWhereFicheIsLocated,
  ].filter((axe): axe is Axe => axe !== undefined);

  const [firstPlan, ...otherPlans] = plansToDisplay;
  return (
    <>
      <BasicBreadcrumbs
        title={title}
        collectiviteId={collectiviteId}
        planId={firstPlan?.id}
      />
      <VisibleWhen condition={plansToDisplay.length > 1}>
        <OtherPlansBreadcrumbs
          plans={otherPlans}
          title={title}
          collectiviteId={collectiviteId}
        />
      </VisibleWhen>
    </>
  );
};
