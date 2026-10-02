'use client';

import { appLabels } from '@/app/labels/catalog';
import { Button } from '@tet/ui';
import { useDownloadDossierDocuments } from '../data/use-download-dossier-documents';
import type { DossierInstructionRef } from '../dossier-instruction-ref';

/** Toutes les pièces du dossier en une archive, pour les lire hors ligne. */
export const DownloadDossierDocumentsButton = ({
  dossierRef,
  disabled,
}: {
  dossierRef: DossierInstructionRef;
  /** Aucun fichier déposé : l'archive serait vide. */
  disabled: boolean;
}) => {
  const archiveDownload = useDownloadDossierDocuments(dossierRef);

  if (archiveDownload.status === 'downloading') {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-grey-8">
          {appLabels.telechargementEnCours}
        </span>
        <Button
          onClick={archiveDownload.cancel}
          icon="close-line"
          variant="outlined"
          size="sm"
        >
          {appLabels.annuler}
        </Button>
      </div>
    );
  }

  return (
    <Button
      icon="download-line"
      size="sm"
      disabled={disabled}
      onClick={archiveDownload.download}
      dataTest="demarches.pcaet.instruction.documents.tout-telecharger"
    >
      {appLabels.instructionDossierToutTelecharger}
    </Button>
  );
};
