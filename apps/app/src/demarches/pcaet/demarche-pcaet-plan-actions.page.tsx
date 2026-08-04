'use client';

import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { PcaetDemarcheShell } from '@/app/demarches/pcaet/components/pcaet-demarche.shell';
import { ProgrammeActionsSection } from '@/app/demarches/pcaet/components/pcaet-plan.section';
import { getDemarchePcaetCompletion } from '@/app/demarches/pcaet/demarche-pcaet-completion';
import { useDemarchePcaet } from '@/app/demarches/pcaet/data/use-demarche-pcaet';
import { useDemarchePcaetId } from '@/app/demarches/pcaet/use-demarche-pcaet-id';
import { notFound } from 'next/navigation';

export const DemarchePcaetPlanActionsPage = () => {
  const demarcheId = useDemarchePcaetId();
  const {
    demarche,
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

  const completion = getDemarchePcaetCompletion(demarche);

  return (
    <PcaetDemarcheShell
      demarche={demarche}
      collectiviteId={collectiviteId}
      completion={completion}
      activeSection="plan"
      onUpdate={update}
      onTransmettre={() => applyTransition('transmettre_pour_avis')}
      onReprendre={() => applyTransition('reprendre_elaboration')}
      onPublish={publish}
      onUnpublish={unpublish}
    >
      <ProgrammeActionsSection demarche={demarche} onUpdateAction={update} />
    </PcaetDemarcheShell>
  );
};
