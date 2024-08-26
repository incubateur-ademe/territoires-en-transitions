import {useState} from 'react';
import {Button} from '@tet/ui';
import Chart from 'ui/charts/Chart';
import {LineData} from 'ui/charts/Line/LineChart';
import {AreaSymbol} from 'ui/charts/ChartLegend';
import {genInfobulleParAnnee} from './InfobulleParAnnee';
import {COMMON_CHART_PROPS, COULEURS_SECTEUR} from './constants';

export type GrapheSousSecteursProps = {
  titre: string;
  unite: string;
  sousSecteurs: LineData[];
};

/**
 * Affiche le graphique sous-sectoriel
 *
 * - Aires empilées des sous-secteurs associés au secteur affiché.
 */
export const GrapheSousSecteurs = ({
  titre,
  unite,
  sousSecteurs,
}: GrapheSousSecteursProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // affecte d'abord les couleurs avant de filtrer les dataset vides
  const sousSecteursNonVides = sousSecteurs
    .map((s, i) => ({
      ...s,
      color: COULEURS_SECTEUR[i % COULEURS_SECTEUR.length],
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
            sliceTooltip: genInfobulleParAnnee({
              objectifsEtResultats: [],
              secteurs: sousSecteursNonVides,
            }),
          },
        }}
      />
    </>
  );
};
