'use client';

import { DiagnosticTabs } from '@/app/demarches/pcaet/diagnostic/diagnostic.tabs';
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
}: {
  dossierRef: DossierInstructionRef;
  demarcheId: number;
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
      title={appLabels.instructionDossierEtapeDiagnostic}
      description={appLabels.instructionDossierEtapeDiagnosticDescription}
    />
  );
};
