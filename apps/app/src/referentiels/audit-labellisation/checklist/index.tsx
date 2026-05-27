'use client';

import { makeReferentielUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { DemandeLabellisationModal } from '@/app/referentiels/labellisations/DemandeLabellisationModal';
import { StartAuditButton } from '@/app/referentiels/labellisations/start-audit/start-audit.button';
import { TCycleLabellisation } from '@/app/referentiels/labellisations/useCycleLabellisation';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Divider, Spacer } from '@tet/ui';
import { ReactElement, useState } from 'react';
import { Parcours } from '../checklist-view-model';
import { AskPremiereEtoileButton } from './ask-premiere-etoile.button';
import { CandidatureDocumentsSection } from './candidature-documents.section';
import { Container } from './container';
import { Header } from './header';
import { LabellisationChecklistTable } from './labellisation-checklist.table';

export const ChecklistView = ({
  cycle,
  viewModel,
}: {
  cycle: TCycleLabellisation;
  viewModel: Parcours;
}): ReactElement => {
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();
  const { peutDemanderEtoile, peutDemander1ereEtoileCOT, isCOT } = cycle;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Container>
      <Header
        title={appLabels.demandePremiereEtoile}
        subtitle={appLabels.renseignerCriteresPourPremiereEtoile}
        action={
          <>
            <AskPremiereEtoileButton
              enabled={peutDemanderEtoile || peutDemander1ereEtoileCOT}
              onClick={() => setIsOpen(true)}
            />
            <StartAuditButton referentielId={referentielId} />
          </>
        }
      />
      <Spacer height={1} />
      <Divider />
      <Spacer height={1} />
      <p className="text-sm font-normal text-primary-10 m-0">
        {appLabels.premiereEtoileSansAudit}
      </p>
      <Spacer height={1} />
      <LabellisationChecklistTable
        viewModel={viewModel}
        collectiviteId={collectiviteId}
        referentielId={referentielId}
        referentielUrl={makeReferentielUrl({
          collectiviteId,
          referentielId,
          referentielTab: 'detail',
        })}
      />
      <Spacer height={1} />
      <CandidatureDocumentsSection />
      <DemandeLabellisationModal
        parcoursLabellisation={cycle}
        isCOT={isCOT}
        opened={isOpen}
        setOpened={setIsOpen}
      />
    </Container>
  );
};
