'use client';

import { appLabels } from '@/app/labels/catalog';
import { usePreuvesLabellisation } from '@/app/referentiels/labellisations/useCycleLabellisation';
import { ReactElement } from 'react';
import { useChecklist } from '../../../checklist.context';
import { DocumentLine } from './document-line';
import { DownloadPreuveButton } from './download-preuve-button';
import { UploadPreuveButton } from './upload-preuve-button';

type ActeEngagementState =
  | { kind: 'signed'; demandeId: number; canReplace: boolean }
  | { kind: 'uploadable' }
  | { kind: 'hidden' };

const getActeEngagementState = ({
  signed,
  demandeId,
  canUploadActe,
}: {
  signed: boolean;
  demandeId: number | null;
  canUploadActe: boolean;
}): ActeEngagementState => {
  if (signed && demandeId !== null) {
    return { kind: 'signed', demandeId, canReplace: canUploadActe };
  }
  if (canUploadActe) {
    return { kind: 'uploadable' };
  }
  return { kind: 'hidden' };
};

const ActeDepose = ({
  demandeId,
  canReplace,
}: {
  demandeId: number;
  canReplace: boolean;
}): ReactElement => {
  const { data: preuves, isLoading } = usePreuvesLabellisation(demandeId);
  const actePreuve = preuves?.[0] ?? null;
  const displayedName = isLoading
    ? appLabels.chargement
    : actePreuve?.fichier?.filename ?? appLabels.acteEngagementDepose;

  return (
    <DocumentLine filename={displayedName}>
      {actePreuve?.fichier && (
        <DownloadPreuveButton fichier={actePreuve.fichier} />
      )}
      {canReplace && actePreuve !== null && (
        <UploadPreuveButton
          replacePreuveId={actePreuve.id}
          title={appLabels.televerserActeEngagementSigne}
          label={appLabels.remplacerLeFichier}
        />
      )}
    </DocumentLine>
  );
};

export const ActeEngagementSection = ({
  signed,
  demandeId,
}: {
  signed: boolean;
  demandeId: number | null;
}): ReactElement | null => {
  const { cycle } = useChecklist();
  const state = getActeEngagementState({
    signed,
    demandeId,
    canUploadActe: cycle.viewerRole === 'auditee',
  });

  if (state.kind === 'signed') {
    return (
      <ActeDepose demandeId={state.demandeId} canReplace={state.canReplace} />
    );
  }
  if (state.kind === 'uploadable') {
    return (
      <UploadPreuveButton
        title={appLabels.televerserActeEngagementSigne}
        label={appLabels.acteEngagementUploadButton}
      />
    );
  }
  return null;
};
