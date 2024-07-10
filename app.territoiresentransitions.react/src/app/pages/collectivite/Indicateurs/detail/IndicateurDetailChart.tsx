import {useState} from 'react';
import classNames from 'classnames';

import {Button} from '@tet/ui';
import IndicateurChart from 'app/pages/collectivite/Indicateurs/chart/IndicateurChart';
import {TIndicateurDefinition} from 'app/pages/collectivite/Indicateurs/types';
import {useIndicateurValeurs} from 'app/pages/collectivite/Indicateurs/useIndicateurValeurs';
import {getLeftLineChartMargin} from 'ui/charts/Line/utils';
import {transformeValeurs} from './transformeValeurs';

type Props = {
  definition: TIndicateurDefinition;
  titre: string;
  fileName: string;
  rempli: boolean | null;
  source?: string;
};

/**
 * Utiliser dans les pages indicateurs.
 * Permet notamment de télécharger le graphique.
 */
const IndicateurDetailChart = ({
  definition,
  rempli,
  source,
  titre,
  fileName,
}: Props) => {
  /** Gère l'affichage de la modale */
  const [isChartOpen, setIsChartOpen] = useState(false);

  // charge les valeurs à afficher dans le graphe
  const {data: valeursBrutes, isLoading: isLoadingValeurs} =
    useIndicateurValeurs({
      id: definition.id,
      importSource: source,
      autoRefresh: true,
    });

  // sépare les données objectifs/résultats
  const {valeurs} = transformeValeurs(valeursBrutes, source);
  const data = {
    unite: definition.unite,
    valeurs,
  };

  // Rempli ne peut pas être utilisé pour l'affichage car les objectifs ne sont pas pris en compte mais doivent quand même apparaître
  const hasValeurOrObjectif = valeurs.length > 0;

  return (
    <div
      data-test={`chart-${definition.id}`}
      className="flex flex-col p-6 border border-grey-4 rounded-lg"
    >
      <div className="flex justify-between gap-16 mb-6">
        <div
          className={classNames('font-bold', {
            'grow text-center': !hasValeurOrObjectif,
          })}
        >
          {titre}
        </div>
        {!!rempli && (
          <Button
            size="xs"
            variant="outlined"
            className="h-fit shrink-0"
            onClick={() => setIsChartOpen(true)}
          >
            Télécharger le graphique
          </Button>
        )}
      </div>

      <IndicateurChart
        className="min-h-[16rem]"
        isLoading={isLoadingValeurs}
        data={data}
        chartConfig={{
          theme: {
            axis: {
              ticks: {
                text: {
                  fontSize: 14,
                },
              },
            },
          },
          margin: {
            top: 16,
            right: 16,
            bottom: 48,
            left: getLeftLineChartMargin(data.valeurs) + 8,
          },
          legend: {isOpen: true},
        }}
        chartInfos={{
          modal: {isOpen: isChartOpen, setIsOpen: setIsChartOpen},
          fileName,
          title: titre,
        }}
      />

      {!hasValeurOrObjectif && (
        <div className="mx-auto text-sm text-grey-7">
          Aucune valeur renseignée pour l’instant
        </div>
      )}
    </div>
  );
};

export default IndicateurDetailChart;
