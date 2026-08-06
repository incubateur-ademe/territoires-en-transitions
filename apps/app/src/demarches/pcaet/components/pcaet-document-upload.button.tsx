'use client';

import { appLabels } from '@/app/labels/catalog';
import { AddPreuveModal } from '@/app/referentiels/preuves/AddPreuveModal';
import { PDF_ONLY_FILE_CONSTRAINTS } from '@/app/referentiels/preuves/upload/constants';
import { Button, Modal, PillButton } from '@tet/ui';
import { ReactElement } from 'react';

type Props = {
  label: string;
  icon?: 'upload-line';
  variant?: 'pill' | 'primary' | 'outlined';
  disabled?: boolean;
  dataTest?: string;
  /** Rattache le fichier choisi (téléversé ou pris dans la bibliothèque). */
  onAddFichier: (fichierId: number) => void;
};

/**
 * Dépôt d'une pièce du dossier PCAET via la modale d'ajout de document standard.
 * Aucun gestionnaire de lien n'est fourni : l'onglet « Lien » disparaît et il
 * reste « Fichier » et « Bibliothèque », le fichier atterrissant dans la
 * bibliothèque de la collectivité comme n'importe quel document.
 */
export const PcaetDocumentUploadButton = ({
  label,
  icon = 'upload-line',
  variant = 'pill',
  disabled = false,
  dataTest,
  onAddFichier,
}: Props): ReactElement => (
  <Modal
    size="lg"
    title={appLabels.demarchePcaetDocumentsModaleTitre}
    subTitle={appLabels.demarchePcaetDocumentsFormatPdf}
    render={({ close }) => (
      <AddPreuveModal
        docType="demarche_pcaet"
        fileConstraints={PDF_ONLY_FILE_CONSTRAINTS}
        onClose={close}
        handlers={{ addFileFromLib: (fichierId) => onAddFichier(fichierId) }}
      />
    )}
  >
    {variant === 'pill' ? (
      <PillButton
        icon={icon}
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
        icon={icon}
        iconPosition="right"
        className="w-fit"
        disabled={disabled}
        data-test={dataTest}
      >
        {label}
      </Button>
    )}
  </Modal>
);
