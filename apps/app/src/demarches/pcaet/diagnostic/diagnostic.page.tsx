'use client';

import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { DemarchePcaetPublicationStatusEnum } from '@tet/domain/demarches';
import { DiagnosticTopicsSection } from '@/app/demarches/pcaet/diagnostic/diagnostic-topics-section';
import { DemarcheShell } from '@/app/demarches/components/shell';
import { emptyDemarchePcaetCompletion } from '@/app/demarches/completion';
import { useDemarchePcaet } from '@/app/demarches/pcaet/data/use-demarche';
import { useDemarcheId } from '@/app/demarches/use-demarche-id';
import type { DemarchePcaetVulnerabiliteState } from '@/app/demarches/types';
import { notFound } from 'next/navigation';

export const DemarchePcaetDiagnosticPage = () => {
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

  const handleVulnerabiliteChange = (
    vulnerabilite: DemarchePcaetVulnerabiliteState
  ): void => {
    update({
      vulnerabilite,
      topics: { ...demarche.topics, vulnerabilite_territoire: 'complete' },
      vulnerabiliteValideeLe: new Date().toISOString(),
    });
  };

  return (
    <DemarcheShell
      demarche={demarche}
      collectiviteId={collectiviteId}
      completion={completion ?? emptyDemarchePcaetCompletion()}
      activeSection="diagnostic"
      onUpdate={update}
      onTransmettre={() => applyTransition('transmettre_pour_avis')}
      onReprendre={() => applyTransition('reprendre_elaboration')}
      onPublish={publish}
      onUnpublish={unpublish}
    >
      <DiagnosticTopicsSection
        collectiviteId={collectiviteId}
        demarche={demarche}
        isReadonly={isPublished}
        onVulnerabiliteChange={handleVulnerabiliteChange}
      />
    </DemarcheShell>
  );
};
