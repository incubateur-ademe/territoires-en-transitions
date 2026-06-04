'use client';

import { appLabels } from '@/app/labels/catalog';
import { Alert, Button } from '@tet/ui';
import { JSX } from 'react';

export const PasteErrorsAlert = ({
  messages,
  onDismiss,
}: {
  messages: string[];
  onDismiss: () => void;
}): JSX.Element => (
  <Alert
    state="warning"
    title={appLabels.demarchePcaetPolluantsCellulesIgnorees}
    description={messages.join(' · ')}
    footer={
      <Button size="xs" variant="outlined" onClick={onDismiss}>
        {appLabels.demarchePcaetPolluantsMasquerErreurs}
      </Button>
    }
  />
);
