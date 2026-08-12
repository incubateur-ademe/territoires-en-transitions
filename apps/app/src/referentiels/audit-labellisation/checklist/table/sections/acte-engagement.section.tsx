'use client';

import { appLabels } from '@/app/labels/catalog';
import { usePreuvesLabellisation } from '@/app/referentiels/labellisations/useCycleLabellisation';
import {
  ObjetPreuve,
  ObjetPreuveEnum,
  ReferentielId,
  selectPreuvesByObjet,
} from '@tet/domain/referentiels';
import { ChecklistTable, InlineLink } from '@tet/ui';
import { ReactElement } from 'react';
import { match } from 'ts-pattern';
import { useChecklist } from '../../../checklist.context';
import { DocumentLine } from './document-line';
import { DownloadPreuveButton } from './download-preuve-button';
import { UploadPreuveButton } from './upload-preuve-button';
import { DownloadableFichier } from './use-download-preuve';

export type ActePreuve = {
  id: number;
  objet: ObjetPreuve | null;
  fichier: DownloadableFichier | null;
};

type ActeEngagementState =
  | { kind: 'loading' }
  | { kind: 'deposited'; actes: readonly ActePreuve[]; canReplace: boolean }
  | { kind: 'uploadable' }
  | { kind: 'hidden' };

const getActeEngagementState = ({
  actes,
  isLoading,
  canUploadActe,
}: {
  actes: readonly ActePreuve[];
  isLoading: boolean;
  canUploadActe: boolean;
}): ActeEngagementState => {
  if (isLoading) {
    return { kind: 'loading' };
  }
  if (actes.length > 0) {
    return { kind: 'deposited', actes, canReplace: canUploadActe };
  }
  if (canUploadActe) {
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
    <span>{appLabels.acteEngagementDescription}</span>
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

const ActeDepose = ({
  acte,
  canReplace,
}: {
  acte: ActePreuve;
  canReplace: boolean;
}): ReactElement => (
  <DocumentLine
    filename={acte.fichier?.filename ?? appLabels.acteEngagementDepose}
  >
    {acte.fichier && <DownloadPreuveButton fichier={acte.fichier} />}
    {canReplace && (
      <UploadPreuveButton
        objet={ObjetPreuveEnum.ACTE_ENGAGEMENT}
        replacePreuveId={acte.id}
        title={appLabels.televerserActeEngagementSigne}
        label={appLabels.remplacerLeFichier}
      />
    )}
  </DocumentLine>
);

const ActesDeposes = ({
  actes,
  canReplace,
}: {
  actes: readonly ActePreuve[];
  canReplace: boolean;
}): ReactElement => (
  <ul className="m-0 flex flex-col gap-1">
    {actes.map((acte) => (
      <li key={acte.id}>
        <ActeDepose acte={acte} canReplace={canReplace} />
      </li>
    ))}
  </ul>
);

type ActeEngagementSectionProps = {
  actes: readonly ActePreuve[];
  isLoading: boolean;
  canUploadActe: boolean;
};

export const ActeEngagementSection = ({
  actes,
  isLoading,
  canUploadActe,
}: ActeEngagementSectionProps): ReactElement | null =>
  match(getActeEngagementState({ actes, isLoading, canUploadActe }))
    .with({ kind: 'loading' }, () => (
      <DocumentLine filename={appLabels.chargement}>{null}</DocumentLine>
    ))
    .with({ kind: 'deposited' }, (state) => (
      <ActesDeposes actes={state.actes} canReplace={state.canReplace} />
    ))
    .with({ kind: 'uploadable' }, () => (
      <UploadPreuveButton
        objet={ObjetPreuveEnum.ACTE_ENGAGEMENT}
        title={appLabels.televerserActeEngagementSigne}
        label={appLabels.acteEngagementUploadButton}
      />
    ))
    .with({ kind: 'hidden' }, () => null)
    .exhaustive();

type ActeEngagementRowWithDemandeProps = {
  referentielId: ReferentielId;
  demandeId: number;
  canUploadActe: boolean;
};

const ActeEngagementRowWithDemande = ({
  referentielId,
  demandeId,
  canUploadActe,
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
          canUploadActe={canUploadActe}
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
      canUploadActe={isAuditee}
    />
  );
};
