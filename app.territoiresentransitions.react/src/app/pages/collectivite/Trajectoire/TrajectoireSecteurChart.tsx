/**
 * Affiche le graphique de la trajectoire d'un secteur
 *
 * - Trajectoire (simple ligne hachurée)
 * - Mes objectifs (simple ligne)
 * - Mes résultats (simple ligne)
 */

import {useState} from 'react';
import {Datum} from '@nivo/line';
import {Button} from '@tet/ui';
import Chart from 'ui/charts/Chart';
import {DashedLineSymbol, SolidLineSymbol} from 'ui/charts/ChartLegend';
import {StyledLineLayer} from 'ui/charts/Line/utils';
import {LAYERS} from './constants';
import {COMMON_CHART_PROPS} from 'app/pages/collectivite/Trajectoire/TrajectoireChart';

export type TrajectoireSecteurChartProps = {
  titre: string;
  unite: string;
  secteur: Datum[];
  objectifs: Datum[];
  resultats: Datum[];
};

export const TrajectoireSecteurChart = ({
  titre,
  unite,
  secteur,
  objectifs,
  resultats,
}: TrajectoireSecteurChartProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="flex justify-between">
        <h3 className="ml-2">{titre}</h3>
        <Button
          className="h-fit"
          icon="download-fill"
          title="Télécharger"
          size="xs"
          variant="outlined"
          onClick={() => setIsOpen(true)}
        />
      </div>
      <Chart
        infos={{
          title: titre,
          fileName: titre,
          modal: {isOpen, setIsOpen, size: 'xl'},
        }}
        line={{
          chart: {
            ...COMMON_CHART_PROPS,
            enableArea: false,
            yScale: {
              ...COMMON_CHART_PROPS.yScale,
              stacked: false,
            },
            axisLeftLegend: unite,
            legend: {
              isOpen: true,
              className: 'text-primary-8 font-medium',
              size: 'sm',
            },
            layers: [
              'grid',
              'markers',
              'axes',
              'areas',
              'crosshair',
              StyledLineLayer,
              'points',
              'slices',
              'mesh',
              'legends',
            ],
            data: [
              {
                id: LAYERS.resultats.label,
                color: LAYERS.resultats.color,
                data: resultats,
                symbole: SolidLineSymbol,
                style: {strokeWidth: 4},
              },
              {
                id: LAYERS.objectifs.label,
                color: LAYERS.objectifs.color,
                data: objectifs,
                symbole: SolidLineSymbol,
                style: {strokeWidth: 4},
              },
              {
                id: LAYERS.trajectoire.label,
                color: LAYERS.trajectoire.color,
                data: secteur,
                symbole: DashedLineSymbol,
                style: {
                  strokeDasharray: '4, 4',
                  strokeWidth: 4,
                },
              },
            ].filter(s => !!s.data?.length),
          },
        }}
      />
    </>
  );
};
