'use client';

import { DemarcheShell } from '@/app/demarches/components/shell';
import { useDemarchePcaet } from '@/app/demarches/pcaet/data/use-demarche';
import { useGetPcaetDiagnostic } from '@/app/demarches/pcaet/diagnostic/data/use-get-pcaet-diagnostic';
import { DiagnosticTabs } from '@/app/demarches/pcaet/diagnostic/diagnostic.tabs';
import { useDemarcheId } from '@/app/demarches/use-demarche-id';
import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { notFound } from 'next/navigation';

export const DemarchePcaetDiagnosticPage = () => {
  const demarcheId = useDemarcheId();
  const {
    demarche,
    completion,
    isLoading,
    update,
    transmettrePourAvis,
    publier,
    depublier,
    collectiviteId,
  } = useDemarchePcaet(demarcheId);
  const {
    diagnostic,
    isLoading: isDiagnosticLoading,
    isError: isDiagnosticError,
    refetch: refetchDiagnostic,
  } = useGetPcaetDiagnostic(demarcheId);

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

  // Passée la clôture de l'instruction, l'écran ne sert plus à compléter le
  // diagnostic mais à le relire pour répondre aux avis.
  const estRappel = demarche.avalModifiable;

  return (
    <DemarcheShell
      demarche={demarche}
      collectiviteId={collectiviteId}
      completion={completion}
      activeSection="diagnostic"
      onUpdate={update}
      onTransmettre={transmettrePourAvis}
      onPublish={publier}
      onUnpublish={depublier}
    >
      <DiagnosticTabs
        demarcheId={demarcheId}
        diagnostic={diagnostic}
        isLoading={isDiagnosticLoading}
        isError={isDiagnosticError}
        onRetry={() => refetchDiagnostic()}
        isReadonly={!demarche.amontModifiable}
        title={
          estRappel
            ? appLabels.demarcheAvanceRappelDiagnosticLabel
            : appLabels.demarcheDiagnosticTitre
        }
        description={
          estRappel
            ? appLabels.demarcheAvanceRappelDiagnosticDescription
            : appLabels.demarcheDiagnosticDescription
        }
      />
    </DemarcheShell>
  );
};
