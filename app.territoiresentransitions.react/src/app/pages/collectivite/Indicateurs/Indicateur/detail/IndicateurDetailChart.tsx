import { TIndicateurDefinition } from '@/app/app/pages/collectivite/Indicateurs/types';
import PictoIndicateurVide from '@/app/ui/pictogrammes/PictoIndicateurVide';
import { Button, EmptyCard, Select } from '@/ui';
import classNames from 'classnames';
import { useState } from 'react';
import DownloadIndicateurChartModal from '../../chart/DownloadIndicateurChart';
import IndicateurChart from '../../chart/IndicateurChart';
import { useIndicateurChartInfo } from '../../data/use-indicateur-chart';

type Props = {
  definition: TIndicateurDefinition;
  className?: string;
  buttonClassName?: string;
};

const SegmentationNames: Record<string, string> = {
  secteur: 'Indicateurs sectoriels',
  vecteur: 'Indicateurs vectoriels',
  vecteur_filiere: 'Indicateurs vecteur x filière',
};

/**
 * Utilisé dans les pages indicateurs.
 * Permet notamment de télécharger le graphique.
 */
const IndicateurDetailChart = ({ definition, className }: Props) => {
  /** Gère l'affichage de la modale */
  const [isChartOpen, setIsChartOpen] = useState(false);

  // charge les valeurs à afficher dans le graphe
  const chartInfo = useIndicateurChartInfo({
    definition,
  });
  const {
    typesSegmentation,
    segmentation,
    setSegmentation,
    hasValeur,
    isLoading,
  } = chartInfo;

  return hasValeur ? (
    <>
      {
        /* sélecteur de segmentation */
        typesSegmentation?.length > 1 && (
          <Select
            values={segmentation}
            options={typesSegmentation.map((type) => ({
              label: SegmentationNames[type],
              value: type,
            }))}
            onChange={(v) => v && setSegmentation(v as string)}
          />
        )
      }

      <div
        data-test={`chart-${definition.id}`}
        className={classNames('w-full', className)}
      >
        <div className="flex justify-between mx-8">
          <Button
            size="xs"
            variant="outlined"
            className="ml-auto"
            onClick={() => setIsChartOpen(true)}
          >
            Télécharger le graphique
          </Button>
        </div>

        <IndicateurChart chartInfo={chartInfo} isLoading={isLoading} />
      </div>

      <DownloadIndicateurChartModal
        openState={{ isOpen: isChartOpen, setIsOpen: setIsChartOpen }}
        chartInfo={chartInfo}
        isLoading={isLoading}
        title={definition.titre}
      />
    </>
  ) : (
    <EmptyCard
      size="xs"
      className="h-64 w-full"
      picto={(props) => <PictoIndicateurVide {...props} />}
      title="Aucune valeur n'est associée aux résultats ou aux objectifs de la collectivité !"
    />
  );
};

export default IndicateurDetailChart;
