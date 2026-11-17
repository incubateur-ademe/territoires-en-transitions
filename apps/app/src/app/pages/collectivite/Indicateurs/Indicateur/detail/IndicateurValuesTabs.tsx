import { Alert } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { IndicateurTable } from '../../table/indicateur-table';
import { useIndicateurData } from '../../detail/indicateur-data.context';

// un message spécifique doit être affiché pour les indicateurs de la séquestration carbone
const ID_SEQUESTRATION = 'cae_63.';

/** Affiche la saisie des résultats et objectifs par période */
export const IndicateurValuesTabs = ({
  isReadonly,
  openModalState,
}: {
  isReadonly: boolean;
  openModalState?: OpenState;
}) => {
  const { indicateur } = useIndicateurData();

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
        readonly={isReadonly}
        openModalState={openModalState}
      />
    </>
  );
};
