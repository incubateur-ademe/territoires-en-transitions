'use client';

import { appLabels } from '@/app/labels/catalog';
import { useGetReferentielDefinitionFromContext } from '@/app/referentiels/referentiel-context';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Divider, Spacer, VisibleWhen } from '@tet/ui';
import { ReactElement } from 'react';
import { Parcours } from '../checklist-view-model';
import { useChecklist } from '../checklist.context';
import { isLabellisationVisee } from '../sujet-vise';
import { AuditTableHintBanner } from './audit-table-hint.banner';
import { ChecklistActions } from './checklist-actions';
import { EtoileViseeField } from './etoile-visee.field';
import { Container } from './layout/container';
import { Header } from './layout/header';
import { SujetCotViseField } from './sujet-cot-vise.field';
import { LabellisationChecklistTable } from './table/labellisation-checklist.table';

export const ChecklistView = ({
  viewModel,
}: {
  viewModel: Parcours;
}): ReactElement => {
  const collectiviteId = useCollectiviteId();
  const {
    referentielId,
    cycle,
    sujetVise,
    sujetCotVise,
    selectEtoileVisee,
    selectSujetCotVise,
  } = useChecklist();
  const hierarchie = useGetReferentielDefinitionFromContext()?.hierarchie ?? [];

  const isLabellisation = isLabellisationVisee(sujetVise);
  const isPremiereEtoile = isLabellisation && viewModel.etoileObjectif === 1;

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
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        <VisibleWhen condition={cycle.isCOT}>
          <SujetCotViseField
            value={sujetCotVise}
            onChange={selectSujetCotVise}
          />
        </VisibleWhen>
        <VisibleWhen condition={isLabellisation}>
          <EtoileViseeField
            value={viewModel.etoileObjectif}
            etoilesObtenues={cycle.parcours?.labellisation?.etoiles ?? 0}
            onChange={selectEtoileVisee}
          />
        </VisibleWhen>
      </div>
      <Spacer height={1} />
      <VisibleWhen condition={isPremiereEtoile}>
        <p className="m-0 text-xs text-grey-7">
          {appLabels.premiereEtoileSansAudit}
        </p>
        <Spacer height={1} />
      </VisibleWhen>
      <LabellisationChecklistTable
        viewModel={viewModel}
        collectiviteId={collectiviteId}
        referentielId={referentielId}
        hierarchie={hierarchie}
      />
    </Container>
  );
};
