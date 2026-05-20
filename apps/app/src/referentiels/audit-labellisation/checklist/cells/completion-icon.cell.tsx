import { appLabels } from '@/app/labels/catalog';
import { cn, Icon } from '@tet/ui';
import { ReactElement } from 'react';
import { BorderedCell } from './bordered.cell';

export const CompletionIconCell = ({
  done,
}: {
  done: boolean;
}): ReactElement => (
  <BorderedCell>
    <div className="flex items-center justify-center">
      <Icon
        icon={done ? 'checkbox-circle-fill' : 'close-circle-fill'}
        size="lg"
        role="img"
        aria-label={
          done ? appLabels.critereAtteint : appLabels.critereNonAtteint
        }
        className={cn({
          'text-success': done,
          'text-warning-1': !done,
        })}
      />
    </div>
  </BorderedCell>
);
