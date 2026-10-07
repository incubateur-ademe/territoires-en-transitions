'use client';

import { appLabels } from '@/app/labels/catalog';
import { capitalize } from '@/app/utils/formatUtils';
import { JSX } from 'react';
import { IndicateurValeurRequiseMarker } from './indicateur-valeur-requise.marker';
import { IndicateurValeurTypeBadge } from './indicateur-valeur-type.badge';

export const IndicateurValeursTableLegend = ({
  isRequiredValeurLegendVisible,
}: {
  isRequiredValeurLegendVisible?: boolean;
}): JSX.Element => (
  <ul className="m-0 flex flex-wrap items-center gap-x-6 gap-y-1 p-0 list-none text-xs text-grey-7">
    <li className="flex items-center gap-2">
      <IndicateurValeurTypeBadge indicateurValeurType="resultat" />
      {capitalize(appLabels.indicateurResultat())}
    </li>
    <li className="flex items-center gap-2">
      <IndicateurValeurTypeBadge indicateurValeurType="objectif" />
      {capitalize(appLabels.indicateurObjectif())}
    </li>

    {isRequiredValeurLegendVisible && (
      <li className="flex items-center gap-2">
        <IndicateurValeurRequiseMarker />
        {appLabels.pcaetDiagnosticIndicateurValeurRequiseAide}
      </li>
    )}
  </ul>
);
