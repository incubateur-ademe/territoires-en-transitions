'use client';

import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { isDemarchePcaetDiagnosticMutable } from '@tet/domain/demarches';
import { DiagnosticTopicsSection } from '@/app/demarches/pcaet/diagnostic/diagnostic-topics-section';
import { DemarcheShell } from '@/app/demarches/components/shell';
import { useDemarchePcaet } from '@/app/demarches/pcaet/data/use-demarche';
import { useDemarchePcaetDiagnostic } from '@/app/demarches/pcaet/diagnostic/data/use-diagnostic';
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
  const {
    topics,
    snapshotDate,
    isLoading: isDiagnosticLoading,
    isError: isDiagnosticError,
    refetch: refetchDiagnostic,
  } = useDemarchePcaetDiagnostic(demarcheId);

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

  const handleVulnerabiliteChange = (
    vulnerabilite: DemarchePcaetVulnerabiliteState
  ): void => {
    update({
      vulnerabilite,
      vulnerabiliteValideeLe: new Date().toISOString(),
    });
  };

  return (
    <DemarcheShell
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
      <DiagnosticTopicsSection
        demarche={demarche}
        topics={topics}
        isLoading={isDiagnosticLoading}
        isError={isDiagnosticError}
        onRetry={() => refetchDiagnostic()}
        snapshotDate={snapshotDate}
        isReadonly={!isDemarchePcaetDiagnosticMutable(demarche.statut)}
        onVulnerabiliteChange={handleVulnerabiliteChange}
      />
    </DemarcheShell>
  );
};
