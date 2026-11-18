'use client';

import { DemarcheSection } from '@/app/demarches/components/section';
import { PlansContenu } from '@/app/demarches/pcaet/components/plans-contenu';
import { DownloadDemarcheExportButton } from '@/app/demarches/pcaet/exports/download-demarche-export.button';
import { appLabels } from '@/app/labels/catalog';
import type { RouterOutput } from '@tet/api';
import type { DossierInstructionRef } from '../dossier-instruction-ref';

type Dossier = RouterOutput['demarches']['pcaet']['getDossierInstruction'];

/**
 * Programme d'actions du dossier, tel que l'instructeur le lit.
 *
 * `collectiviteId` est celle de la déposante, jamais celle du service qui
 * instruit : c'est elle qui porte les plans, et donc leur adresse.
 */
export const EtapePlanSection = ({
  dossierRef,
  plans,
  collectiviteId,
}: {
  dossierRef: DossierInstructionRef;
  plans: Dossier['plans'];
  collectiviteId: number;
}) => (
  <DemarcheSection
    title={appLabels.instructionDossierEtapePlan}
    description={appLabels.instructionDossierEtapePlanDescription}
    action={
      // Sans saisine, le dépôt n'a pas été transmis : rien à télécharger.
      'demandeAvisId' in dossierRef ? (
        <DownloadDemarcheExportButton dossierRef={dossierRef} type="plan" />
      ) : null
    }
  >
    <PlansContenu
      plans={plans}
      emptyTitle={appLabels.instructionDossierPlanAucun}
      dataTestPrefix="demarches.pcaet.instruction"
      collectiviteId={collectiviteId}
    />
  </DemarcheSection>
);
