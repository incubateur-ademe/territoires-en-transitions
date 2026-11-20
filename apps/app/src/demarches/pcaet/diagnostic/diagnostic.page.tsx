'use client';

import { DemarcheShell } from '@/app/demarches/components/shell';
import { useDemarchePcaet } from '@/app/demarches/pcaet/data/use-demarche';
import { useGetPcaetDiagnostic } from '@/app/demarches/pcaet/diagnostic/data/use-get-pcaet-diagnostic';
import { DiagnosticTabs } from '@/app/demarches/pcaet/diagnostic/diagnostic.tabs';
import { DownloadDemarcheExportButton } from '@/app/demarches/pcaet/exports/download-demarche-export.button';
import { useDemarcheId } from '@/app/demarches/use-demarche-id';
import { appLabels } from '@/app/labels/catalog';
import { isDemarchePcaetEnCours } from '@tet/domain/demarches';
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

  // Pendant la phase d'avis, l'écran ne sert qu'à relire le diagnostic tel
  // qu'il a été transmis. Il se rouvre après les avis, pour le dépôt final.
  // Un EPCI couvert le lit, sans l'avoir transmis.
  const estRappel = !demarche.contenuModifiable && !demarche.lectureSeule;

  return (
    <DemarcheShell
      demarche={demarche}
      collectiviteId={collectiviteId}
      completion={completion}
      activeSection="diagnostic"
      onUpdate={update}
      onTransmettre={transmettrePourAvis}
      onPublish={publier}
    >
      <DiagnosticTabs
        demarcheId={demarcheId}
        diagnostic={diagnostic}
        isLoading={isDiagnosticLoading}
        isError={isDiagnosticError}
        onRetry={() => refetchDiagnostic()}
        isReadonly={!demarche.contenuModifiable}
        showCompletion={isDemarchePcaetEnCours(demarche.statut)}
        title={
          demarche.lectureSeule
            ? appLabels.demarcheLectureDiagnosticLabel
            : estRappel
            ? appLabels.demarcheAvanceRappelDiagnosticLabel
            : appLabels.demarcheDiagnosticTitre
        }
        description={
          demarche.lectureSeule
            ? appLabels.demarcheLectureDiagnosticDescription
            : estRappel
            ? appLabels.demarcheAvanceRappelDiagnosticDescription
            : appLabels.demarcheDiagnosticDescription
        }
        action={
          <DownloadDemarcheExportButton
            dossierRef={{ demarcheId, collectiviteId }}
            type="indicateurs"
          />
        }
      />
    </DemarcheShell>
  );
};
