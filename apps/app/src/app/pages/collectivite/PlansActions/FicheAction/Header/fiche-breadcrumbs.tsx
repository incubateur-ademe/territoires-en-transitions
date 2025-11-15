import { FicheResume } from '@/domain/plans';
import { Button, VisibleWhen } from '@/ui';
import { useState } from 'react';
import { ClassifiedFicheBreadcrumbs } from './classified-fiche-breadcrumbs';
import { NotClassifiedFicheBreadcrumbs } from './not-classified-fiche-breadcrumbs';

type Axe = Pick<
  NonNullable<FicheResume['axes']>[number],
  'id' | 'planId' | 'collectiviteId'
>;

type FichesBreadcrumbsProps = {
  titre: string;
  collectiviteId: number;
  axes: Axe[];
  planId?: number;
};

const OtherPlansBreadcrumbs = ({
  axes,
  titre,
  collectiviteId,
}: {
  axes: Axe[];
  titre: string;
  collectiviteId: number;
}): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const s = axes.length > 1 ? 's' : '';
  return (
    <div className="mt-4 flex flex-col gap-2">
      <Button
        variant="underlined"
        size="sm"
        icon={isOpen ? 'arrow-up-s-line' : 'arrow-down-s-line'}
        iconPosition="right"
        onClick={() => setIsOpen((prevState) => !prevState)}
      >
        Autre{s} emplacement{s} pour cette fiche
      </Button>

      <VisibleWhen condition={isOpen}>
        {axes.map((axe, index) => (
          <ClassifiedFicheBreadcrumbs
            key={index}
            titre={titre}
            axeId={axe.id}
            collectiviteId={collectiviteId}
          />
        ))}
      </VisibleWhen>
    </div>
  );
};

const Breadcrumbs = ({
  titre,
  collectiviteId,
  currentPlanId,
}: {
  titre: string;
  collectiviteId: number;
  currentPlanId: number | undefined;
}) => {
  const isFicheClassified = currentPlanId !== undefined;
  if (isFicheClassified) {
    return (
      <ClassifiedFicheBreadcrumbs
        titre={titre}
        axeId={currentPlanId}
        collectiviteId={collectiviteId}
      />
    );
  }
  return (
    <NotClassifiedFicheBreadcrumbs
      title={titre}
      collectiviteId={collectiviteId}
    />
  );
};

export const FicheBreadcrumbs = ({
  titre,
  collectiviteId,
  axes,
  planId,
}: FichesBreadcrumbsProps) => {
  const currentPlanAxe = axes.find((a) => a.planId === planId);
  const otherAxesWhereFicheIsLocated = axes.filter(
    (axe) =>
      axe.id !== currentPlanAxe?.id && axe.collectiviteId === collectiviteId
  );
  const isFicheInOtherPlans = otherAxesWhereFicheIsLocated.length > 0;

  return (
    <>
      <Breadcrumbs
        titre={titre}
        collectiviteId={collectiviteId}
        currentPlanId={currentPlanAxe?.id}
      />
      <VisibleWhen condition={isFicheInOtherPlans}>
        <OtherPlansBreadcrumbs
          axes={otherAxesWhereFicheIsLocated}
          titre={titre}
          collectiviteId={collectiviteId}
        />
      </VisibleWhen>
    </>
  );
};
