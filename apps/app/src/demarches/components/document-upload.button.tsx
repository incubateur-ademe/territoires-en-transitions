'use client';

import { appLabels } from '@/app/labels/catalog';
import { AddPreuveModal } from '@/app/referentiels/preuves/AddPreuveModal';
import {
  MAX_FILE_SIZE_MB,
  type FileConstraints,
} from '@/app/referentiels/preuves/upload/constants';
import type { DemarcheType } from '@tet/domain/demarches';
import { Button, MenuAction, Modal, PillButton, SplitButton } from '@tet/ui';
import { JSX, ReactElement, useState } from 'react';

/** `file-add-fill` est l'icône d'ajout de document du parcours preuves : le
 * dépôt d'une pièce se signale pareil partout dans l'application. */
const UPLOAD_ICON = 'file-add-fill';

type UploadProps = {
  /** Type de démarche : les libellés affichés en dépendent. */
  demarcheType: DemarcheType;
  /** Formats acceptés par le dossier, tels que son type les déclare. */
  fileConstraints: FileConstraints;
  /** Rattache le fichier choisi (téléversé ou pris dans la bibliothèque). */
  onAddFichier: (fichierId: number) => void;
};

/**
 * Modale d'ajout de document standard, réglée pour le dossier d'une démarche.
 * Aucun gestionnaire de lien n'est fourni : l'onglet « Lien » disparaît et il
 * reste « Fichier » et « Bibliothèque », le fichier atterrissant dans la
 * bibliothèque de la collectivité comme n'importe quel document.
 *
 * S'ouvre soit au clic sur l'élément passé en enfant, soit par `openState` quand
 * le déclencheur n'est pas un simple bouton (cas du bouton scindé, dont seule la
 * moitié principale doit ouvrir la modale).
 */
const DemarcheDocumentUploadModal = ({
  demarcheType,
  fileConstraints,
  onAddFichier,
  openState,
  children,
}: UploadProps & {
  openState?: { isOpen: boolean; setIsOpen: (opened: boolean) => void };
  children?: JSX.Element;
}): ReactElement => (
  <Modal
    size="lg"
    title={appLabels.demarcheDocumentsModaleTitre({
      type: appLabels.demarcheTypeLabels[demarcheType],
    })}
    subTitle={appLabels.aideUploadFichier({
      tailleMaxMo: MAX_FILE_SIZE_MB,
      formats: fileConstraints.formats,
    })}
    openState={openState}
    render={({ close }) => (
      <AddPreuveModal
        docType="demarche_pcaet"
        fileConstraints={fileConstraints}
        onClose={close}
        handlers={{ addFileFromLib: (fichierId) => onAddFichier(fichierId) }}
      />
    )}
  >
    {children}
  </Modal>
);

type ButtonProps = UploadProps & {
  label: string;
  variant?: 'pill' | 'primary' | 'outlined';
  disabled?: boolean;
  dataTest?: string;
};

/** Dépôt d'une pièce du dossier, en un seul bouton. */
export const DemarcheDocumentUploadButton = ({
  label,
  variant = 'pill',
  disabled = false,
  dataTest,
  ...uploadProps
}: ButtonProps): ReactElement => (
  <DemarcheDocumentUploadModal {...uploadProps}>
    {variant === 'pill' ? (
      <PillButton
        icon={UPLOAD_ICON}
        iconPosition="right"
        disabled={disabled}
        data-test={dataTest}
      >
        {label}
      </PillButton>
    ) : (
      <Button
        variant={variant}
        size="xs"
        icon={UPLOAD_ICON}
        iconPosition="right"
        className="w-fit"
        disabled={disabled}
        data-test={dataTest}
      >
        {label}
      </Button>
    )}
  </DemarcheDocumentUploadModal>
);

/**
 * Dépôt d'une pièce, avec ses actions secondaires rangées derrière la flèche.
 * Le dépôt domine nettement le reste — retirer la pièce, retirer la ligne : il
 * reste à un clic là où un menu complet lui en coûterait deux.
 */
export const DemarcheDocumentUploadSplitButton = ({
  label,
  menuActions,
  dataTest,
  menuDataTest,
  ...uploadProps
}: UploadProps & {
  label: string;
  menuActions: MenuAction[];
  dataTest?: string;
  menuDataTest?: string;
}): ReactElement => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <SplitButton
        variant="outlined"
        size="xs"
        icon={UPLOAD_ICON}
        iconPosition="right"
        onClick={() => setIsOpen(true)}
        dataTest={dataTest}
        menuDataTest={menuDataTest}
        menuActions={menuActions}
      >
        {label}
      </SplitButton>
      <DemarcheDocumentUploadModal
        {...uploadProps}
        openState={{ isOpen, setIsOpen }}
      />
    </>
  );
};
