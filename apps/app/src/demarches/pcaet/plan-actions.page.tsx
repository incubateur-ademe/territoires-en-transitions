'use client';

import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { DemarcheShell } from '@/app/demarches/components/shell';
import {
  isPcaetPlan,
  PCAET_PLAN_TYPE_LABEL,
} from '@/app/demarches/pcaet/constants';
import { ProgrammeActionsSection } from '@/app/demarches/components/plan.section';
import { emptyDemarchePcaetCompletion } from '@/app/demarches/completion';
import { useDemarchePcaet } from '@/app/demarches/pcaet/data/use-demarche';
import { useDemarcheId } from '@/app/demarches/use-demarche-id';
import { notFound } from 'next/navigation';

export const DemarchePcaetPlanActionsPage = () => {
  const demarcheId = useDemarcheId();
  const {
    demarche,
    completion,
    isLoading,
    update,
    applyTransition,
    publish,
    unpublish,
    collectiviteId,
  } =
    useDemarchePcaet(demarcheId);

  if (isLoading) {
    return (
      <div className="flex grow items-center justify-center">
        <SpinnerLoader />
      </div>
    );
  }

  if (!demarche) {
    notFound();
  }


  return (
    <DemarcheShell
      demarche={demarche}
      collectiviteId={collectiviteId}
      completion={completion ?? emptyDemarchePcaetCompletion()}
      activeSection="plan"
      onUpdate={update}
      onTransmettre={() => applyTransition('transmettre_pour_avis')}
      onReprendre={() => applyTransition('reprendre_elaboration')}
      onPublish={publish}
      onUnpublish={unpublish}
    >
      <ProgrammeActionsSection
        demarche={demarche}
        eligibility={{
          planTypeLabel: PCAET_PLAN_TYPE_LABEL,
          isEligiblePlan: isPcaetPlan,
        }}
        onUpdateAction={update}
      />
    </DemarcheShell>
  );
};
