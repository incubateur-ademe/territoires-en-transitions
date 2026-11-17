import { Alert } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { useIndicateurDefinition } from '../../detail/indicateur-definition.context';
import { IndicateurTable } from '../../table/indicateur-table';

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
  const { indicateur } = useIndicateurDefinition();

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
        confidentiel={indicateur.estConfidentiel || false}
        readonly={isReadonly}
        openModalState={openModalState}
      />
    </>
  );
};
