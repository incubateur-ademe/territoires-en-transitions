'use client';

import { PcaetDemarcheShell } from '@/app/demarches/pcaet/components/pcaet-demarche.shell';
import { ProgrammeActionsSection } from '@/app/demarches/pcaet/components/pcaet-plan.section';
import { getDemarchePcaetCompletion } from '@/app/demarches/pcaet/demarche-pcaet-completion';
import { useDemarchePcaet } from '@/app/demarches/pcaet/use-demarche-pcaet';
import { notFound } from 'next/navigation';

type Props = {
  demarcheId: string;
};

export const DemarchePcaetPlanActionsPage = ({ demarcheId }: Props) => {
  const { demarche, update, publish, unpublish, collectiviteId } =
    useDemarchePcaet(demarcheId);

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
      onPublish={publish}
      onUnpublish={unpublish}
    >
      <ProgrammeActionsSection demarche={demarche} onUpdateAction={update} />
    </PcaetDemarcheShell>
  );
};
