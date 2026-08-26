'use client';

import { DemarcheSection } from '@/app/demarches/components/section';
import { PlansContenu } from '@/app/demarches/pcaet/components/plans-contenu';
import { useDemarchePcaetPlans } from '@/app/demarches/pcaet/data/use-plans';
import { appLabels, type DemarcheTypeLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ErrorCard } from '@/app/utils/error/error.card';

/**
 * Rappel du programme d'actions, pendant la finalisation.
 *
 * La collectivité y relit ce qu'elle a transmis pour répondre aux avis, dans la
 * même vue que celle remise aux instructeurs. L'écran de rattachement des plans
 * ne conviendrait pas ici : il montre le périmètre, pas le contenu, et il n'y a
 * plus rien à rattacher à ce stade.
 */
export const RappelPlanSection = ({
  collectiviteId,
  demarcheId,
  typeLabels,
}: {
  collectiviteId: number;
  demarcheId: number;
  typeLabels: DemarcheTypeLabels;
}) => {
  const { plans, isLoading, isError, refetch } = useDemarchePcaetPlans({
    collectiviteId,
    demarcheId,
  });

  return (
    <DemarcheSection
      title={appLabels.demarcheAvanceRappelPlanLabel({ type: typeLabels })}
      description={appLabels.demarcheAvanceRappelPlanDescription}
    >
      {isError ? (
        <ErrorCard
          title={appLabels.demarcheRappelPlanErreur}
          retry={() => refetch()}
        />
      ) : isLoading ? (
        <div className="flex py-8">
          <SpinnerLoader className="m-auto" />
        </div>
      ) : (
        <PlansContenu
          plans={plans}
          emptyTitle={appLabels.demarcheRappelPlanAucun}
          dataTestPrefix="demarches.pcaet.rappel"
        />
      )}
    </DemarcheSection>
  );
};
