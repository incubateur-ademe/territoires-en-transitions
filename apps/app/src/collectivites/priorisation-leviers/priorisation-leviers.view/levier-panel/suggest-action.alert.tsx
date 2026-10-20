import { appLabels } from '@/app/labels/catalog';
import { LevierId } from '@tet/domain/shared';
import { Alert, Button } from '@tet/ui';
import { JSX, useState } from 'react';
import { match } from 'ts-pattern';
import { SuggestActionForm } from './suggest-action.form';

type SuggestActionStatus = 'idle' | 'editing';

type SuggestActionAlertProps = {
  levierId: LevierId;
};

export const SuggestActionAlert = ({
  levierId,
}: SuggestActionAlertProps): JSX.Element => {
  const [status, setStatus] = useState<SuggestActionStatus>('idle');

  return (
    <Alert
      state="warning"
      customIcon="alarm-warning-line"
      title={appLabels.ilManqueUneAction}
      description={appLabels.listeNonExhaustiveSignalerAction}
      footer={match(status)
        .with('idle', () => (
          <Button
            size="xs"
            variant="outlined"
            icon="add-line"
            onClick={() => setStatus('editing')}
          >
            {appLabels.suggererUneAction}
          </Button>
        ))
        .with('editing', () => (
          <SuggestActionForm
            levierId={levierId}
            onCancel={() => setStatus('idle')}
          />
        ))
        .exhaustive()}
    />
  );
};
