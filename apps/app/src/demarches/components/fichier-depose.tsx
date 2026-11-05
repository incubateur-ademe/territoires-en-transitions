'use client';

import { MissingFileBadge } from '@/app/collectivites/documents/bibliotheque/missing-file.badge';
import { Icon } from '@tet/ui';
import { ReactElement } from 'react';

/**
 * Fichier rattaché à une pièce du dossier. Cliquable quand l'appelant sait le
 * télécharger — c'est le même affichage pour une pièce attendue et pour une
 * pièce additionnelle.
 *
 * Sans taille, le contenu n'est plus dans le stockage (supprimé par
 * l'antivirus, ou perdu) : la pièce reste affichée, sans téléchargement.
 */
export const FichierDepose = ({
  fichier,
  onDownload,
}: {
  fichier: { filename: string; filesize: number | null };
  onDownload?: () => void;
}): ReactElement => {
  if (isFichierIndisponible(fichier)) {
    return (
      <div className="flex items-center gap-2 text-grey-7 min-w-0">
        <MissingFileBadge />
        <span className="font-medium truncate">{fichier.filename}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-grey-9 min-w-0">
      <Icon
        icon="checkbox-circle-fill"
        size="sm"
        className="text-success shrink-0"
      />
      {onDownload ? (
        <button
          type="button"
          className="font-medium text-primary-8 hover:underline truncate text-left"
          onClick={onDownload}
        >
          {fichier.filename}
        </button>
      ) : (
        <span className="font-medium truncate">{fichier.filename}</span>
      )}
    </div>
  );
};

export const isFichierIndisponible = (fichier: {
  filesize: number | null;
}): boolean => fichier.filesize === null;
