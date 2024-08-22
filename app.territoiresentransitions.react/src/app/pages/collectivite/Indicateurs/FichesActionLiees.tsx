import {Field} from '@tet/ui';
import {objectToSnake} from 'ts-case-convert';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {
  useFichesActionLiees,
  useUpdateFichesActionLiees,
} from './useFichesActionLiees';
import {TIndicateurDefinition} from './types';
import FichesActionsDropdown from 'ui/dropdownLists/FichesActionsDropdown/FichesActionsDropdown';
import FichesLieesListe from '../PlansActions/FicheAction/FichesLiees/FichesLieesListe';

export type TFichesActionProps = {
  definition: TIndicateurDefinition;
};

/**
 * Affiche les fiches actions liées à un indicateur
 */
export const FichesActionLiees = (props: TFichesActionProps) => {
  const {definition} = props;
  const collectivite = useCurrentCollectivite();
  const {data: fiches} = useFichesActionLiees(definition);

  const {mutate: updateFichesActionLiees} =
    useUpdateFichesActionLiees(definition);
  const isReadonly = collectivite?.readonly ?? false;

  return (
    <>
      <Field title="Fiches des plans liées">
        <FichesActionsDropdown
          disabled={isReadonly}
          ficheCouranteId={null}
          values={(fiches ? objectToSnake(fiches) : []).map(f =>
            f.id.toString()
          )}
          onChange={({fiches: nouvellesFiches}) =>
            updateFichesActionLiees(nouvellesFiches.map(f => f.id))
          }
        />
      </Field>

      <FichesLieesListe fiches={fiches ? objectToSnake(fiches) : []} />
    </>
  );
};
