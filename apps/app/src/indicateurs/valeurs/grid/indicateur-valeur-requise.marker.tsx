import { appLabels } from '@/app/labels/catalog';
import { JSX } from 'react';

export const IndicateurValeurRequiseMarker = (): JSX.Element => (
  <span
    className="text-warning-1 text-xs font-semibold"
    title={appLabels.indicateurValeurRequise}
  >
    {'*'}
  </span>
);
