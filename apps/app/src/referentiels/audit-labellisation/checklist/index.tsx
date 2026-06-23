'use client';

import { makeReferentielUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Divider, Spacer } from '@tet/ui';
import { ReactElement } from 'react';
import { Parcours } from '../checklist-view-model';
import { CandidatureDocumentsSection } from './candidature-documents.section';
import { ChecklistActions } from './checklist-actions';
import { Container } from './container';
import { Header } from './header';
import { LabellisationChecklistTable } from './labellisation-checklist.table';

export const ChecklistView = ({
  viewModel,
}: {
  viewModel: Parcours;
}): ReactElement => {
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();

  return (
    <Container>
      <Header
        title={appLabels.demandePremiereEtoile}
        subtitle={appLabels.renseignerCriteresPourPremiereEtoile}
        action={<ChecklistActions />}
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
    </Container>
  );
};
