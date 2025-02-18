import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { Alert } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { IndicateurChartInfo } from '../../data/use-indicateur-chart';
import { IndicateurTable } from '../../table/indicateur-table';
import { TIndicateurDefinition } from '../../types';

// un message spécifique doit être affiché pour les indicateurs de la séquestration carbone
const ID_SEQUESTRATION = 'cae_63.';

/** Affiche les onglets résultats/objectifs */
export const IndicateurValuesTabs = ({
  definition,
  chartInfo,
  openModalState,
}: {
  definition: TIndicateurDefinition;
  chartInfo: IndicateurChartInfo;
  openModalState?: OpenState;
}) => {
  const collectivite = useCurrentCollectivite();
  const isReadonly = !collectivite || collectivite.isReadOnly;
  const { confidentiel } = definition;

  return (
    <>
      {!isReadonly && (
        <>
          {definition.identifiant?.startsWith(ID_SEQUESTRATION) && (
            <Alert
              className="mb-8"
              state="warning"
              title="Les données sont attendues au format ALDO : positives en cas de séquestration et négatives en cas d’émission."
            />
          )}
        </>
      )}
      {!!collectivite?.collectiviteId && (
        <IndicateurTable
          chartInfo={chartInfo}
          collectiviteId={collectivite.collectiviteId}
          definition={definition}
          confidentiel={confidentiel}
          readonly={!collectivite || collectivite.isReadOnly}
          openModalState={openModalState}
        />
      )}
    </>
  );
};
