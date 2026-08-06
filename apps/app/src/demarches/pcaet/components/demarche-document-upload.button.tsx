'use client';

import { appLabels } from '@/app/labels/catalog';
import { AddPreuveModal } from '@/app/referentiels/preuves/AddPreuveModal';
import { PDF_ONLY_FILE_CONSTRAINTS } from '@/app/referentiels/preuves/upload/constants';
import type { DemarcheType } from '@tet/domain/demarches';
import { Button, Modal, PillButton } from '@tet/ui';
import { ReactElement } from 'react';

type Props = {
  label: string;
  /** Type de démarche : les libellés affichés en dépendent. */
  demarcheType: DemarcheType;

  icon?: 'upload-line';
  variant?: 'pill' | 'primary' | 'outlined';
  disabled?: boolean;
  dataTest?: string;
  /** Rattache le fichier choisi (téléversé ou pris dans la bibliothèque). */
  onAddFichier: (fichierId: number) => void;
};

/**
 * Dépôt d'une pièce du dossier via la modale d'ajout de document standard.
 * Aucun gestionnaire de lien n'est fourni : l'onglet « Lien » disparaît et il
 * reste « Fichier » et « Bibliothèque », le fichier atterrissant dans la
 * bibliothèque de la collectivité comme n'importe quel document.
 */
export const DemarcheDocumentUploadButton = ({
  label,
  demarcheType,
  icon = 'upload-line',
  variant = 'pill',
  disabled = false,
  dataTest,
  onAddFichier,
}: Props): ReactElement => (
  <Modal
    size="lg"
    title={appLabels.demarcheDocumentsModaleTitre({
      type: appLabels.demarcheTypeLabels[demarcheType],
    })}
    subTitle={appLabels.demarcheDocumentsFormatPdf({
      type: appLabels.demarcheTypeLabels[demarcheType],
    })}
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
