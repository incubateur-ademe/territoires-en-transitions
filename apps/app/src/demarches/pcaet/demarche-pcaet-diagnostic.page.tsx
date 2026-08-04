'use client';

import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { DemarchePcaetPublicationStatusEnum } from '@tet/domain/demarches';
import { DiagnosticVoletsSection } from '@/app/demarches/pcaet/components/diagnostic-volets-section';
import { PcaetDemarcheShell } from '@/app/demarches/pcaet/components/pcaet-demarche.shell';
import { getDemarchePcaetCompletion } from '@/app/demarches/pcaet/demarche-pcaet-completion';
import { useDemarchePcaet } from '@/app/demarches/pcaet/data/use-demarche-pcaet';
import { useDemarchePcaetId } from '@/app/demarches/pcaet/use-demarche-pcaet-id';
import type { DemarchePcaetVulnerabiliteState } from '@/app/demarches/pcaet/demarche-pcaet.types';
import { notFound } from 'next/navigation';

export const DemarchePcaetDiagnosticPage = () => {
  const demarcheId = useDemarchePcaetId();
  const {
    demarche,
    isLoading,
    update,
    applyTransition,
    publish,
    unpublish,
    collectiviteId,
  } = useDemarchePcaet(demarcheId);

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

  const isPublished =
    demarche.statutPublication === DemarchePcaetPublicationStatusEnum.PUBLISHED;
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
      onTransmettre={() => applyTransition('transmettre_pour_avis')}
      onReprendre={() => applyTransition('reprendre_elaboration')}
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
