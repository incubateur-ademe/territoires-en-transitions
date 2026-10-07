'use client';

import { Icon } from '@tet/ui';
import { ReactElement } from 'react';

/**
 * Fichier rattaché à une pièce du dossier. Cliquable quand l'appelant sait le
 * télécharger — c'est le même affichage pour une pièce attendue et pour une
 * pièce additionnelle.
 */
export const FichierDepose = ({
  filename,
  onDownload,
}: {
  filename: string;
  onDownload?: () => void;
}): ReactElement => (
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
        {filename}
      </button>
    ) : (
      <span className="font-medium truncate">{filename}</span>
    )}
  </div>
);
