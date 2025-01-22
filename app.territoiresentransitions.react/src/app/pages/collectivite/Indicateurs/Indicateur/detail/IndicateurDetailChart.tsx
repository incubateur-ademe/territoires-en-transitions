import classNames from 'classnames';
import { useState } from 'react';

import { TIndicateurDefinition } from '@/app/app/pages/collectivite/Indicateurs/types';
import { useIndicateurValeurs } from '@/app/app/pages/collectivite/Indicateurs/useIndicateurValeurs';
import PictoIndicateurVide from '@/app/ui/pictogrammes/PictoIndicateurVide';
import { Button, EmptyCard, Icon } from '@/ui';
import DownloadIndicateurChartModal from '../../chart/DownloadIndicateurChart';
import IndicateurChart from '../../chart/IndicateurChart';
import { DataSourceTooltip } from './DataSourceTooltip';
import { transformeValeurs } from './transformeValeurs';

type Props = {
  definition: TIndicateurDefinition;
  titre: string;
  fileName: string;
  rempli: boolean | null;
  source?: string;
  className?: string;
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
  className,
}: Props) => {
  /** Gère l'affichage de la modale */
  const [isChartOpen, setIsChartOpen] = useState(false);

  // charge les valeurs à afficher dans le graphe
  const { data: valeursBrutes, isLoading: isLoadingValeurs } =
    useIndicateurValeurs({
      id: definition.id,
      importSource: source,
      autoRefresh: true,
    });

  // sépare les données objectifs/résultats
  const { valeurs, objectifs, resultats, metadonnee } = transformeValeurs(
    valeursBrutes,
    source
  );

  const data = {
    unite: definition.unite,
    valeurs: { objectifs, resultats },
  };

  // Rempli ne peut pas être utilisé pour l'affichage car les objectifs ne sont pas pris en compte mais doivent quand même apparaître
  const hasValeurOrObjectif = valeurs.length > 0;

  return hasValeurOrObjectif ? (
    <>
      <div
        data-test={`chart-${definition.id}`}
        className={classNames('flex flex-col', className)}
      >
        <div className="flex justify-between mx-8">
          {!!rempli && (
            <Button
              size="xs"
              variant="outlined"
              className="ml-auto"
              onClick={() => setIsChartOpen(true)}
            >
              Télécharger le graphique
            </Button>
          )}
        </div>

        <IndicateurChart data={data} isLoading={isLoadingValeurs} />

        {!!metadonnee && (
          <DataSourceTooltip metadonnee={metadonnee}>
            <Icon icon="information-line" className="text-primary px-6" />
          </DataSourceTooltip>
        )}
      </div>

      <DownloadIndicateurChartModal
        openState={{ isOpen: isChartOpen, setIsOpen: setIsChartOpen }}
        data={data}
        isLoading={isLoadingValeurs}
        title={definition.titre}
      />
    </>
  ) : (
    <EmptyCard
      size="xs"
      className="h-64 my-8"
      picto={(props) => <PictoIndicateurVide {...props} />}
      title="Aucune valeur n'est associée aux résultats ou aux objectifs de la collectivité !"
    />
  );
};

export default IndicateurDetailChart;
