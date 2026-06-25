'use client';

import { appLabels } from '@/app/labels/catalog';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Divider, Spacer, VisibleWhen } from '@tet/ui';
import { ReactElement } from 'react';
import { Parcours } from '../checklist-view-model';
import { useChecklist } from '../checklist.context';
import { AuditTableHintBanner } from './audit-table-hint.banner';
import { ChecklistActions } from './checklist-actions';
import { Container } from './layout/container';
import { Header } from './layout/header';
import { LabellisationChecklistTable } from './table/labellisation-checklist.table';

export const ChecklistView = ({
  viewModel,
}: {
  viewModel: Parcours;
}): ReactElement => {
  const collectiviteId = useCollectiviteId();
  const { referentielId, cycle, showActeEngagement, showCandidatureDocuments } =
    useChecklist();

  const isPremiereEtoile = viewModel.etoileObjectif === 1;

  return (
    <Container>
      <VisibleWhen condition={cycle.isConductingAudit}>
        <AuditTableHintBanner
          collectiviteId={collectiviteId}
          referentielId={referentielId}
        />
        <Spacer height={1} />
      </VisibleWhen>
      <Header
        title={appLabels.demandeAuditOuLabellisation}
        subtitle={appLabels.renseignerCriteresPourDemande}
        action={<ChecklistActions />}
      />
      <Spacer height={1} />
      <Divider />
      <Spacer height={1} />
      <VisibleWhen condition={isPremiereEtoile}>
        <p className="text-sm font-normal text-primary-10 m-0">
          {appLabels.premiereEtoileSansAudit}
        </p>
        <Spacer height={1} />
      </VisibleWhen>
      <LabellisationChecklistTable
        viewModel={viewModel}
        collectiviteId={collectiviteId}
        referentielId={referentielId}
        showActeEngagement={showActeEngagement}
        showCandidatureDocuments={showCandidatureDocuments}
      />
    </Container>
  );
};
