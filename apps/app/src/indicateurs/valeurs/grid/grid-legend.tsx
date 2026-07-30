'use client';

import { appLabels } from '@/app/labels/catalog';
import { JSX } from 'react';
import { ValueFieldBadge } from './value-field.badge';

export const GridLegend = (): JSX.Element => (
  <ul className="m-0 flex flex-wrap items-center gap-x-6 gap-y-1 p-0 list-none text-xs text-grey-7">
    <li className="flex items-center gap-2">
      <ValueFieldBadge field="resultat" />
      {appLabels.indicateurLegendeResultat}
    </li>
    <li className="flex items-center gap-2">
      <ValueFieldBadge field="objectif" />
      {appLabels.indicateurLegendeObjectif}
    </li>
  </ul>
);
