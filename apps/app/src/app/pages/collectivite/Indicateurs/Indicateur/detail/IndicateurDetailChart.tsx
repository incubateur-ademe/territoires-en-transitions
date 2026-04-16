import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { appLabels } from '@/app/labels/catalog';
import PictoIndicateurVide from '@/app/ui/pictogrammes/PictoIndicateurVide';
import { Button, EmptyCard } from '@tet/ui';
import classNames from 'classnames';
import { useState } from 'react';
import DownloadIndicateurChartModal from '../../chart/DownloadIndicateurChart';
import IndicateurChart from '../../chart/IndicateurChart';
import { IndicateurChartInfo } from '../../data/use-indicateur-chart';

type Props = {
  definition: IndicateurDefinition;
  chartInfo: IndicateurChartInfo;
  className?: string;
  buttonClassName?: string;
  isReadonly?: boolean;
  isDownloadable?: boolean;
  onAddValue?: () => void;
};

/**
 *
 * Utilisé dans les pages indicateurs.
 * Permet notamment de télécharger le graphique.
 */
const IndicateurDetailChart = ({
  definition,
  chartInfo,
  className,
  buttonClassName,
  isReadonly = true,
  isDownloadable = true,
  onAddValue,
}: Props) => {
  /** Gère l'affichage de la modale */
  const [isChartOpen, setIsChartOpen] = useState(false);

  const { hasValeur, isLoading, sourceFilter } = chartInfo;

  return hasValeur ? (
    <>
      <div
        data-test={`chart-${definition.id}`}
        className={classNames('w-full', className)}
      >
        {isDownloadable && (
          <div className="flex justify-between mx-8">
            <Button
              size="xs"
              variant="outlined"
              className={classNames('ml-auto', buttonClassName)}
              onClick={() => setIsChartOpen(true)}
            >
              {appLabels.telechargerGraphique}
            </Button>
          </div>
        )}

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
      title={
        sourceFilter.avecDonneesCollectivite
          ? appLabels.aucuneValeurCollectivite
          : appLabels.aucuneValeurTrouvee
      }
      actions={
        sourceFilter.avecDonneesCollectivite
          ? !isReadonly && onAddValue
            ? [
                {
                  children: appLabels.ajouterValeur,
                  onClick: () => onAddValue(),
                },
              ]
            : undefined
          : [
              {
                children: appLabels.supprimerFiltres,
                onClick: () => sourceFilter.setFiltresSource([]),
              },
            ]
      }
    />
  );
};

export default IndicateurDetailChart;
