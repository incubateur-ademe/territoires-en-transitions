import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Alert } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { IndicateurChartInfo } from '../../data/use-indicateur-chart';
import { IndicateurTable } from '../../table/indicateur-table';

// un message spécifique doit être affiché pour les indicateurs de la séquestration carbone
const ID_SEQUESTRATION = 'cae_63.';

/** Affiche la saisie des résultats et objectifs par période */
export const IndicateurValuesTabs = ({
  indicateur,
  chartInfo,
  isReadonly,
  openModalState,
}: {
  isReadonly: boolean;
  indicateur: IndicateurDetaille;
  chartInfo: IndicateurChartInfo;
  openModalState?: OpenState;
}) => {
  const { collectiviteId } = useCurrentCollectivite();

  return (
    <>
      {!isReadonly && (
        <>
          {indicateur.identifiantReferentiel?.startsWith(ID_SEQUESTRATION) && (
            <Alert
              className="mb-8"
              state="warning"
              title="Les données sont attendues au format ALDO : positives en cas de séquestration et négatives en cas d’émission."
            />
          )}
        </>
      )}
      <IndicateurTable
        key={indicateur.id}
        chartInfo={chartInfo}
        collectiviteId={collectiviteId}
        indicateur={indicateur}
        confidentiel={indicateur.estConfidentiel || false}
        readonly={isReadonly}
        openModalState={openModalState}
      />
    </>
  );
};
