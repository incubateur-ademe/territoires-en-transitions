import {useState} from 'react';
import {Button} from '@tet/ui';
import Chart from 'ui/charts/Chart';
import {LineData} from 'ui/charts/Line/LineChart';
import {AreaSymbol} from 'ui/charts/ChartLegend';
import {COULEURS_SOUS_SECTEUR} from './constants';
import {makeTrajectoireChartSliceTooltip} from './TrajectoireChartSliceTooltip';
import {COMMON_CHART_PROPS} from 'app/pages/collectivite/Trajectoire/TrajectoireChart';

export type TrajectoireChartSousSecteursProps = {
  titre: string;
  unite: string;
  sousSecteurs: LineData[];
};

/**
 * Affiche le graphique sous-sectoriel
 *
 * - Aires empilées des sous-secteurs associés au secteur affiché.
 */
export const TrajectoireChartSousSecteurs = ({
  titre,
  unite,
  sousSecteurs,
}: TrajectoireChartSousSecteursProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // affecte d'abord les couleurs avant de filtrer les dataset vides
  const sousSecteursNonVides = sousSecteurs
    .map((s, i) => ({
      ...s,
      color: COULEURS_SOUS_SECTEUR[i % COULEURS_SOUS_SECTEUR.length],
    }))
    .filter(s => !!s.data?.length);

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
            axisLeftLegend: unite,
            data: sousSecteursNonVides,
            legend: {
              isOpen: true,
              className: 'text-primary-8 font-medium',
              size: 'sm',
              items: sousSecteursNonVides.map(({label, color}, i) => ({
                name: label!,
                color,
                symbole: AreaSymbol,
              })),
            },
            sliceTooltip: makeTrajectoireChartSliceTooltip({
              objectifsEtResultats: [],
              secteurs: sousSecteursNonVides,
            }),
          },
        }}
      />
    </>
  );
};
