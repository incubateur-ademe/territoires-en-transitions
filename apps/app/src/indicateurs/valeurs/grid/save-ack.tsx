import { appLabels } from '@/app/labels/catalog';
import { Icon } from '@tet/ui';
import { JSX } from 'react';

export const SaveAck = (): JSX.Element => (
  <span
    role="status"
    className="pointer-events-none absolute right-1 text-success-1"
  >
    <span aria-hidden>
      <Icon icon="check-line" size="sm" />
    </span>
    <span className="sr-only">{appLabels.indicateurValeurEnregistree}</span>
  </span>
);
