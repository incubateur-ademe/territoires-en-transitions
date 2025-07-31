import { useCurrentCollectivite } from '@/api/collectivites';
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
  const { collectiviteId, isReadOnly } = useCurrentCollectivite();
  const { confidentiel } = definition;

  return (
    <>
      {!isReadOnly && (
        <>
          {definition.identifiantReferentiel?.startsWith(ID_SEQUESTRATION) && (
            <Alert
              className="mb-8"
              state="warning"
              title="Les données sont attendues au format ALDO : positives en cas de séquestration et négatives en cas d’émission."
            />
          )}
        </>
      )}
      <IndicateurTable
        chartInfo={chartInfo}
        collectiviteId={collectiviteId}
        definition={definition}
        confidentiel={confidentiel || false}
        readonly={isReadOnly}
        openModalState={openModalState}
      />
    </>
  );
};
