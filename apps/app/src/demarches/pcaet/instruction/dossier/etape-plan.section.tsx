'use client';

import { DemarcheSection } from '@/app/demarches/components/section';
import { PlansContenu } from '@/app/demarches/pcaet/components/plans-contenu';
import { appLabels } from '@/app/labels/catalog';
import type { RouterOutput } from '@tet/api';

type Dossier = RouterOutput['demarches']['pcaet']['getDossierInstruction'];

/** Programme d'actions du dossier, tel que l'instructeur le lit. */
export const EtapePlanSection = ({ plans }: { plans: Dossier['plans'] }) => (
  <DemarcheSection
    title={appLabels.instructionDossierEtapePlan}
    description={appLabels.instructionDossierEtapePlanDescription}
  >
    <PlansContenu
      plans={plans}
      emptyTitle={appLabels.instructionDossierPlanAucun}
      dataTestPrefix="demarches.pcaet.instruction"
    />
  </DemarcheSection>
);
