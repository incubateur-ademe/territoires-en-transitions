'use client';

import { DemarcheSection } from '@/app/demarches/components/section';
import { appLabels } from '@/app/labels/catalog';
import PictoAction from '@/app/ui/pictogrammes/PictoAction';
import { EmptyCard } from '@tet/ui';
import { ReactNode } from 'react';

export const EtapePlanSection = ({ footer }: { footer: ReactNode }) => (
  <DemarcheSection
    title={appLabels.instructionDossierEtapePlan}
    description={appLabels.instructionDossierEtapePlanDescription}
  >
    <EmptyCard
      picto={({ className }) => <PictoAction className={className} />}
      title={appLabels.instructionDossierPlanAVenir}
    />
    {footer}
  </DemarcheSection>
);
