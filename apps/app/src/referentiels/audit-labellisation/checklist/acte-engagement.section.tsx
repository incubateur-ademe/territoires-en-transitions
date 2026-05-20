'use client';

import { appLabels } from '@/app/labels/catalog';
import { useAddPreuveToDemande } from '@/app/referentiels/labellisations/useAddPreuveToDemande';
import { usePreuvesLabellisation } from '@/app/referentiels/labellisations/useCycleLabellisation';
import { AddPreuveModal } from '@/app/referentiels/preuves/AddPreuveModal';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Icon, Modal, PillButton } from '@tet/ui';
import { ReactElement, useState } from 'react';

type ActeEngagementState =
  | { kind: 'signed'; demandeId: number }
  | { kind: 'uploadable' }
  | { kind: 'hidden' };

const getActeEngagementState = ({
  signed,
  demandeId,
  canMutate,
}: {
  signed: boolean;
  demandeId: number | null;
  canMutate: boolean;
}): ActeEngagementState => {
  if (signed && demandeId !== null) {
    return { kind: 'signed', demandeId };
  }
  if (canMutate) {
    return { kind: 'uploadable' };
  }
  return { kind: 'hidden' };
};

const ActeUploadButton = ({
  replacePreuveId,
}: {
  /** Présent → bouton « Remplacer » : ajoute le nouveau fichier puis supprime cette preuve. */
  replacePreuveId?: number;
}): ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  const handlers = useAddPreuveToDemande({ replacePreuveId });
  const isReplace = replacePreuveId !== undefined;

  return (
    <Modal
      size="lg"
      openState={{ isOpen, setIsOpen }}
      title={appLabels.televerserActeEngagementSigne}
      render={({ close }) => (
        <AddPreuveModal onClose={close} handlers={handlers} />
      )}
    >
      <PillButton
        icon="upload-line"
        onClick={() => setIsOpen(true)}
        iconPosition="right"
      >
        {isReplace
          ? appLabels.remplacerLeFichier
          : appLabels.acteEngagementUploadButton}
      </PillButton>
    </Modal>
  );
};

const ActeDepose = ({ demandeId }: { demandeId: number }): ReactElement => {
  const { hasCollectivitePermission } = useCurrentCollectivite();
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
      {hasCollectivitePermission('referentiels.mutate') &&
        actePreuve !== null && (
          <ActeUploadButton replacePreuveId={actePreuve.id} />
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
  const { hasCollectivitePermission } = useCurrentCollectivite();
  const state = getActeEngagementState({
    signed,
    demandeId,
    canMutate: hasCollectivitePermission('referentiels.mutate'),
  });

  if (state.kind === 'signed') {
    return <ActeDepose demandeId={state.demandeId} />;
  }
  if (state.kind === 'uploadable') {
    return <ActeUploadButton />;
  }
  return null;
};
