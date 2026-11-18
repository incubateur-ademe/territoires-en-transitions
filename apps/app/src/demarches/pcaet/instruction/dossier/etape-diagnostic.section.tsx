'use client';

import { DiagnosticTabs } from '@/app/demarches/pcaet/diagnostic/diagnostic.tabs';
import { DownloadDemarcheExportButton } from '@/app/demarches/pcaet/exports/download-demarche-export.button';
import { appLabels } from '@/app/labels/catalog';
import type { DossierInstructionRef } from '../dossier-instruction-ref';
import { useDiagnosticInstruction } from './data/use-diagnostic-instruction';

/**
 * Le diagnostic tel que l'instructeur le lit : le même écran que celui de la
 * collectivité, en lecture seule.
 *
 * Réutilisé et non recopié. La copie qui vivait ici avait divergé : une grille
 * à six colonnes forçait les onglets « carte » du design-system, à largeur
 * fixe, à se chevaucher — et les libellés disparaissaient sous la carte
 * voisine.
 */
export const EtapeDiagnosticSection = ({
  dossierRef,
  demarcheId,
  showCompletion,
}: {
  dossierRef: DossierInstructionRef;
  demarcheId: number;
  showCompletion: boolean;
}) => {
  const { diagnostic, isLoading, isError, refetch } =
    useDiagnosticInstruction(dossierRef);

  return (
    <DiagnosticTabs
      demarcheId={demarcheId}
      diagnostic={diagnostic ?? null}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      isReadonly
      showCompletion={showCompletion}
      title={appLabels.instructionDossierEtapeDiagnostic}
      description={appLabels.instructionDossierEtapeDiagnosticDescription}
      action={
        // Sans saisine, le dépôt n'a pas été transmis : rien à télécharger.
        'demandeAvisId' in dossierRef ? (
          <DownloadDemarcheExportButton
            dossierRef={dossierRef}
            type="indicateurs"
          />
        ) : null
      }
    />
  );
};
