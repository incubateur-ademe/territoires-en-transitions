import { Icon } from '@tet/ui';
import { JSX } from 'react';
import { appLabels } from '@/app/labels/catalog';
import { RiCheckLine } from '@remixicon/react';

export const SaveAck = (): JSX.Element => (
  <span
    role="status"
    className="pointer-events-none absolute right-1 top-1 text-success-1"
  >
    <span aria-hidden>
      <Icon icon={<RiCheckLine />} size="xs" />
    </span>
    <span className="sr-only">{appLabels.indicateurValeurEnregistree}</span>
  </span>
);
