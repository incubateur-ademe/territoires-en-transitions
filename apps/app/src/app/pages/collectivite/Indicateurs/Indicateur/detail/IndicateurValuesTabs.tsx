import { IndicateurDefinition } from '@/app/indicateurs/definitions/use-get-indicateur-definition';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Alert } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { IndicateurChartInfo } from '../../data/use-indicateur-chart';
import { IndicateurTable } from '../../table/indicateur-table';

// un message spécifique doit être affiché pour les indicateurs de la séquestration carbone
const ID_SEQUESTRATION = 'cae_63.';

/** Affiche les onglets résultats/objectifs */
export const IndicateurValuesTabs = ({
  definition,
  chartInfo,
  isReadonly,
  openModalState,
}: {
  isReadonly: boolean;
  definition: IndicateurDefinition;
  chartInfo: IndicateurChartInfo;
  openModalState?: OpenState;
}) => {
  const { collectiviteId } = useCurrentCollectivite();

  return (
    <>
      {!isReadonly && (
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
        confidentiel={definition.estConfidentiel || false}
        readonly={isReadonly}
        openModalState={openModalState}
      />
    </>
  );
};
