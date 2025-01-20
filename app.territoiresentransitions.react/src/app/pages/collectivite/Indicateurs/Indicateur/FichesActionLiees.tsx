import FichesLieesListe from '@/app/app/pages/collectivite/PlansActions/FicheAction/FichesLiees/FichesLieesListe';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import FichesActionsDropdown from '@/app/ui/dropdownLists/FichesActionsDropdown/FichesActionsDropdown';
import { Field } from '@/ui';
import { objectToSnake } from 'ts-case-convert';
import { TIndicateurDefinition } from '../types';
import {
  useFichesActionLiees,
  useUpdateFichesActionLiees,
} from './useFichesActionLiees';

export type TFichesActionProps = {
  definition: TIndicateurDefinition;
};

/**
 * Affiche les fiches actions liées à un indicateur
 */
export const FichesActionLiees = (props: TFichesActionProps) => {
  const { definition } = props;
  const collectivite = useCurrentCollectivite();
  const { data: fiches } = useFichesActionLiees(definition);

  const { mutate: updateFichesActionLiees } =
    useUpdateFichesActionLiees(definition);
  const isReadonly = collectivite?.isReadOnly ?? false;

  return (
    <>
      <Field title="Fiches des plans liées">
        <FichesActionsDropdown
          disabled={isReadonly}
          ficheCouranteId={null}
          values={(fiches ? objectToSnake(fiches) : []).map((f) =>
            f.id.toString()
          )}
          onChange={({ fiches: nouvellesFiches }) =>
            updateFichesActionLiees(nouvellesFiches.map((f) => f.id))
          }
          dropdownZindex={30}
        />
      </Field>

      <FichesLieesListe fiches={fiches ?? []} />
    </>
  );
};
