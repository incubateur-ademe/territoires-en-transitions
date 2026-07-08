'use client';

import { appLabels } from '@/app/labels/catalog';
import { Button } from '@tet/ui';
import { ReactElement } from 'react';
import { DownloadableFichier, useDownloadPreuve } from './use-download-preuve';

export const DownloadPreuveButton = ({
  fichier,
}: {
  fichier: DownloadableFichier;
}): ReactElement => {
  const downloadPreuve = useDownloadPreuve();

  return (
    <Button
      icon="download-line"
      title={appLabels.telechargerFichier}
      onClick={() => void downloadPreuve(fichier)}
      size="xs"
      variant="grey"
    />
  );
};
