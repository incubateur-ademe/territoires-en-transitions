'use client';

import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { DiagnosticTopicsSection } from '@/app/demarches/pcaet/diagnostic/diagnostic-topics-section';
import { DemarcheShell } from '@/app/demarches/components/shell';
import { useDemarchePcaet } from '@/app/demarches/pcaet/data/use-demarche';
import { useDemarchePcaetDiagnostic } from '@/app/demarches/pcaet/diagnostic/data/use-diagnostic';
import { useDemarcheId } from '@/app/demarches/use-demarche-id';
import { notFound } from 'next/navigation';

export const DemarchePcaetDiagnosticPage = () => {
  const demarcheId = useDemarcheId();
  const {
    demarche,
    completion,
    isLoading,
    update,
    transmettrePourAvis,
    reprendreElaboration,
    publier,
    depublier,
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

  return (
    <DemarcheShell
      demarche={demarche}
      collectiviteId={collectiviteId}
      completion={completion}
      activeSection="diagnostic"
      onUpdate={update}
      onTransmettre={transmettrePourAvis}
      onReprendre={reprendreElaboration}
      onPublish={publier}
      onUnpublish={depublier}
    >
      <DiagnosticTopicsSection
        demarcheId={demarcheId}
        topics={topics}
        isLoading={isDiagnosticLoading}
        isError={isDiagnosticError}
        onRetry={() => refetchDiagnostic()}
        snapshotDate={snapshotDate}
        isReadonly={!demarche.amontModifiable}
      />
    </DemarcheShell>
  );
};
