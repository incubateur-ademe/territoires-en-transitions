'use client';

import { DemarcheSection } from '@/app/demarches/components/section';
import { appLabels } from '@/app/labels/catalog';
import { PictoEtatDesLieux } from '@/app/ui/pictogrammes/PictoEtatDesLieux';
import { EmptyCard } from '@tet/ui';
import { ReactNode } from 'react';

export const EtapeDiagnosticSection = ({ footer }: { footer: ReactNode }) => (
  <DemarcheSection
    title={appLabels.instructionDossierEtapeDiagnostic}
    description={appLabels.instructionDossierEtapeDiagnosticDescription}
  >
    <EmptyCard
      picto={({ className }) => <PictoEtatDesLieux className={className} />}
      title={appLabels.instructionDossierDiagnosticAVenir}
    />
    {footer}
  </DemarcheSection>
);
