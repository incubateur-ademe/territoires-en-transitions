import { FicheWithRelations } from '@tet/domain/plans';
import { Button, VisibleWhen } from '@tet/ui';
import { useState } from 'react';
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
  const N = plans.length;
  const s = N > 1 ? 's' : '';
  return (
    <div className="mt-4 flex flex-col gap-2">
      <Button
        variant="underlined"
        size="sm"
        icon={isOpen ? 'arrow-up-s-line' : 'arrow-down-s-line'}
        iconPosition="right"
        onClick={() => setIsOpen((prevState) => !prevState)}
      >
        {N > 1 ? N : ''} autre{s} emplacement{s} pour cette action{s}
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
  const currentPlanAxe = axes.find((a) => a.planId === planId);
  const otherPlansWhereFicheIsLocated = axes.filter(
    (axe) =>
      axe.id !== currentPlanAxe?.id && axe.collectiviteId === collectiviteId
  );
  const isFicheInOtherPlans = otherPlansWhereFicheIsLocated.length > 0;

  return (
    <>
      <BasicBreadcrumbs
        title={title}
        collectiviteId={collectiviteId}
        planId={currentPlanAxe?.id}
      />
      <VisibleWhen condition={isFicheInOtherPlans}>
        <OtherPlansBreadcrumbs
          plans={otherPlansWhereFicheIsLocated}
          title={title}
          collectiviteId={collectiviteId}
        />
      </VisibleWhen>
    </>
  );
};
