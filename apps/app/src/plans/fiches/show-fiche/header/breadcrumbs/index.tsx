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
  axes,
  title,
  collectiviteId,
}: {
  axes: Axe[];
  planId?: number;
  title: string;
  collectiviteId: number;
}): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const axesCount = axes.length;
  const s = axesCount > 1 ? 's' : '';
  return (
    <div className="mt-1 flex flex-col gap-2">
      <Button
        variant="underlined"
        size="sm"
        icon={isOpen ? 'arrow-up-s-line' : 'arrow-down-s-line'}
        iconPosition="right"
        onClick={() => setIsOpen((prevState) => !prevState)}
      >
        {axesCount > 1 ? axesCount : ''} autre{s} emplacement{s} pour cette
        action{s}
      </Button>

      <VisibleWhen condition={isOpen}>
        {axes.map((axe, index) => (
          <BasicBreadcrumbs
            key={index}
            title={title}
            axeId={axe.id}
            planId={axe.planId ?? undefined}
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
  const otherAxesWhereFicheIsLocated = plansWhereFicheIsLocated.filter(
    (axe) => axe.id !== currentPlanAxe?.id
  );

  const axesToDisplay = [
    currentPlanAxe,
    ...otherAxesWhereFicheIsLocated,
  ].filter((axe): axe is Axe => axe !== undefined);

  const [firstAxe, ...otherAxes] = axesToDisplay;

  return (
    <>
      <BasicBreadcrumbs
        title={title}
        collectiviteId={collectiviteId}
        axeId={firstAxe?.id}
        planId={planId ?? firstAxe?.planId ?? undefined}
      />
      <VisibleWhen condition={axesToDisplay.length > 1}>
        <OtherPlansBreadcrumbs
          axes={otherAxes}
          title={title}
          collectiviteId={collectiviteId}
        />
      </VisibleWhen>
    </>
  );
};
