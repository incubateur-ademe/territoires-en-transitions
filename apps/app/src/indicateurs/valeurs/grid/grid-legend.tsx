'use client';

import { appLabels } from '@/app/labels/catalog';
import { capitalize } from '@tet/ui/labels/plural';
import { JSX } from 'react';
import { IndicateurValueTypeBadge } from './indicateur-valeur-type.badge';

export const GridLegend = (): JSX.Element => (
  <ul className="m-0 flex flex-wrap items-center gap-x-6 gap-y-1 p-0 list-none text-xs text-grey-7">
    <li className="flex items-center gap-2">
      <IndicateurValueTypeBadge field="resultat" />
      {capitalize(appLabels.indicateurResultat())}
    </li>
    <li className="flex items-center gap-2">
      <IndicateurValueTypeBadge field="objectif" />
      {capitalize(appLabels.indicateurObjectif())}
    </li>
  </ul>
);
