'use client';

import { appLabels } from '@/app/labels/catalog';
import { usePreuvesLabellisation } from '@/app/referentiels/labellisations/useCycleLabellisation';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Icon } from '@tet/ui';
import { ReactElement } from 'react';
import { canUploadLabellisationDocument } from '../../rules/can-upload-labellisation-document';
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
    <div className="flex items-center gap-2 text-grey-9">
      <Icon
        icon="checkbox-circle-fill"
        size="sm"
        className="text-success shrink-0"
      />
      <span className="font-medium">{displayedName}</span>
      {canReplace && actePreuve !== null && (
        <UploadPreuveButton
          replacePreuveId={actePreuve.id}
          title={appLabels.televerserActeEngagementSigne}
          label={appLabels.remplacerLeFichier}
        />
      )}
    </div>
  );
};

export const ActeEngagementSection = ({
  signed,
  demandeId,
}: {
  signed: boolean;
  demandeId: number | null;
}): ReactElement | null => {
  const { hasCollectivitePermission, isRoleAuditeur } = useCurrentCollectivite();
  const state = getActeEngagementState({
    signed,
    demandeId,
    canUploadActe: canUploadLabellisationDocument({
      canMutateReferentiels: hasCollectivitePermission('referentiels.mutate'),
      isAuditeur: isRoleAuditeur,
    }),
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
