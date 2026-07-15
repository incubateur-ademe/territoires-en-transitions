'use client';

import { appLabels } from '@/app/labels/catalog';
import { Button } from '@tet/ui';
import { ReactElement } from 'react';
import { DownloadableFichier, useDownloadPreuve } from './use-download-preuve';
import { RiDownloadLine } from '@remixicon/react';

export const DownloadPreuveButton = ({
  fichier,
}: {
  fichier: DownloadableFichier;
}): ReactElement => {
  const downloadPreuve = useDownloadPreuve();

  return (
    <Button
      icon={<RiDownloadLine />}
      title={appLabels.telechargerFichier}
      onClick={() => void downloadPreuve(fichier)}
      size="xs"
      variant="grey"
    />
  );
};
