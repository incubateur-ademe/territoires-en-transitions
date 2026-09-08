'use client';

import { appLabels } from '@/app/labels/catalog';
import { Button } from '@tet/ui';
import { ReactElement } from 'react';
import { useDownloadDocument } from '@/app/referentiels/preuves/data/use-download-document';

export const DownloadPreuveButton = ({
  collectiviteId,
  fichierId,
}: {
  collectiviteId: number;
  fichierId: number;
}): ReactElement => {
  const { mutate: downloadDocument, isPending } = useDownloadDocument({
    collectiviteId,
  });

  return (
    <Button
      icon="download-line"
      title={appLabels.telechargerFichier}
      onClick={() => downloadDocument(fichierId)}
      loading={isPending}
      disabled={isPending}
      size="xs"
      variant="grey"
    />
  );
};
