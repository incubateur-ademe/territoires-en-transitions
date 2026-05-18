'use client';

import { DiagnosticVoletsSection } from '@/app/demarches/pcaet/components/diagnostic-volets-section';
import { PcaetDemarcheShell } from '@/app/demarches/pcaet/components/pcaet-demarche.shell';
import { getDemarchePcaetCompletion } from '@/app/demarches/pcaet/demarche-pcaet-completion';
import { useDemarchePcaet } from '@/app/demarches/pcaet/use-demarche-pcaet';
import type { DemarchePcaetVulnerabiliteState } from '@/app/demarches/pcaet/demarche-pcaet.types';
import { notFound } from 'next/navigation';

type Props = {
  demarcheId: string;
};

export const DemarchePcaetDiagnosticPage = ({ demarcheId }: Props) => {
  const { demarche, update, publish, unpublish, collectiviteId } =
    useDemarchePcaet(demarcheId);

  if (!demarche) {
    notFound();
  }

  const isPublished = demarche.statutPublication === 'publie';
  const completion = getDemarchePcaetCompletion(demarche);

  const handleVulnerabiliteChange = (
    vulnerabilite: DemarchePcaetVulnerabiliteState
  ): void => {
    update({
      vulnerabilite,
      volets: { ...demarche.volets, vulnerabilite_territoire: 'complete' },
      vulnerabiliteValideeLe: new Date().toISOString(),
    });
  };

  return (
    <PcaetDemarcheShell
      demarche={demarche}
      collectiviteId={collectiviteId}
      completion={completion}
      activeSection="diagnostic"
      onUpdate={update}
      onPublish={publish}
      onUnpublish={unpublish}
    >
      <DiagnosticVoletsSection
        collectiviteId={collectiviteId}
        demarche={demarche}
        isReadonly={isPublished}
        onVulnerabiliteChange={handleVulnerabiliteChange}
      />
    </PcaetDemarcheShell>
  );
};
