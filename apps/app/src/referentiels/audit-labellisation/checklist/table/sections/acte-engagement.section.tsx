'use client';

import { appLabels } from '@/app/labels/catalog';
import { usePreuvesLabellisation } from '@/app/referentiels/labellisations/useCycleLabellisation';
import {
  ObjetPreuveEnum,
  ReferentielId,
  selectPreuvesByObjet,
} from '@tet/domain/referentiels';
import { ChecklistTable, InlineLink } from '@tet/ui';
import { ReactElement } from 'react';
import { match } from 'ts-pattern';
import { useChecklist } from '../../../checklist.context';
import { AnswerStack } from './answer-stack';
import { ChecklistPreuve } from './checklist-preuve';
import { DocumentLine } from './document-line';
import { PreuvesList } from './preuves-list';
import { UploadPreuveButton } from './upload-preuve-button';

type ActeEngagementState =
  | { kind: 'loading' }
  | { kind: 'deposited'; actes: readonly ChecklistPreuve[]; canEdit: boolean }
  | { kind: 'uploadable' }
  | { kind: 'hidden' };

const getActeEngagementState = ({
  actes,
  isLoading,
  canEdit,
}: {
  actes: readonly ChecklistPreuve[];
  isLoading: boolean;
  canEdit: boolean;
}): ActeEngagementState => {
  if (isLoading) {
    return { kind: 'loading' };
  }
  if (actes.length > 0) {
    return { kind: 'deposited', actes, canEdit };
  }
  if (canEdit) {
    return { kind: 'uploadable' };
  }
  return { kind: 'hidden' };
};

const ActeEngagementCriterion = ({
  referentielId,
}: {
  referentielId: ReferentielId;
}): ReactElement => (
  <div className="flex flex-col gap-2">
    <span className="font-medium text-primary-10">
      {appLabels.acteEngagementDescription}
    </span>
    <div className="flex gap-4 flex-wrap">
      <InlineLink href={appLabels.acteEngagementDocUrl} openInNewTab>
        {appLabels.acteEngagementDownloadLink}
      </InlineLink>
      <InlineLink
        href={appLabels.reglementLabelUrl({ referentielId })}
        openInNewTab
      >
        {appLabels.acteEngagementReglementLink}
      </InlineLink>
    </div>
  </div>
);

type ActeEngagementSectionProps = {
  actes: readonly ChecklistPreuve[];
  isLoading: boolean;
  canEdit: boolean;
};

export const ActeEngagementSection = ({
  actes,
  isLoading,
  canEdit,
}: ActeEngagementSectionProps): ReactElement | null =>
  match(getActeEngagementState({ actes, isLoading, canEdit }))
    .with({ kind: 'loading' }, () => (
      <DocumentLine filename={appLabels.chargement}>{null}</DocumentLine>
    ))
    .with({ kind: 'deposited' }, (state) => (
      <PreuvesList preuves={state.actes} canEdit={state.canEdit} />
    ))
    .with({ kind: 'uploadable' }, () => (
      <AnswerStack>
        <UploadPreuveButton
          objet={ObjetPreuveEnum.ACTE_ENGAGEMENT}
          title={appLabels.televerserActeEngagementSigne}
          label={appLabels.ajouterDocument}
        />
      </AnswerStack>
    ))
    .with({ kind: 'hidden' }, () => null)
    .exhaustive();

type ActeEngagementRowWithDemandeProps = {
  referentielId: ReferentielId;
  demandeId: number;
  canEdit: boolean;
};

const ActeEngagementRowWithDemande = ({
  referentielId,
  demandeId,
  canEdit,
}: ActeEngagementRowWithDemandeProps): ReactElement => {
  const { data: preuves, isLoading } = usePreuvesLabellisation(demandeId);
  const actes = selectPreuvesByObjet({
    preuves: preuves ?? [],
    objet: ObjetPreuveEnum.ACTE_ENGAGEMENT,
  });

  return (
    <ChecklistTable.Row
      done={actes.length > 0}
      criterion={{
        label: <ActeEngagementCriterion referentielId={referentielId} />,
      }}
      answer={
        <ActeEngagementSection
          actes={actes}
          isLoading={isLoading}
          canEdit={canEdit}
        />
      }
    />
  );
};

export const ActeEngagementRow = (): ReactElement => {
  const { parcours, cycle, referentielId } = useChecklist();
  const demandeId = parcours?.acteEngagement.demandeId ?? null;
  const hasDemande = demandeId !== null;
  const isAuditee = cycle.viewerRole === 'auditee';

  if (!hasDemande) {
    return (
      <ChecklistTable.Row
        done={false}
        criterion={{
          label: <ActeEngagementCriterion referentielId={referentielId} />,
        }}
        answer={null}
      />
    );
  }

  return (
    <ActeEngagementRowWithDemande
      referentielId={referentielId}
      demandeId={demandeId}
      canEdit={isAuditee}
    />
  );
};
