import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import FichesActionsDropdown from '@/app/ui/dropdownLists/FichesActionsDropdown/FichesActionsDropdown';
import { Button, Field } from '@/ui';
import { useCreateFicheResume } from '../../app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheResume';
import FichesLieesListe from '../../app/pages/collectivite/PlansActions/FicheAction/FichesLiees/FichesLieesListe';
import { useFichesActionLiees } from './useFichesActionLiees';
import { useUpdateFichesActionLiees } from './useUpdateFichesActionLiees';

export type TFichesActionProps = {
  actionId: string;
};

/**
 * Affiche les fiches actions liées à une action du référentiel
 */
export const FichesActionLiees = (props: TFichesActionProps) => {
  const { actionId } = props;
  const collectivite = useCurrentCollectivite();
  const { data: fiches } = useFichesActionLiees(actionId);
  const { mutate: createFicheResume } = useCreateFicheResume({
    actionId,
    openInNewTab: true,
  });
  const { mutate: updateFichesActionLiees } =
    useUpdateFichesActionLiees(actionId);
  const isReadonly = collectivite?.isReadOnly ?? false;

  return (
    <div className="flex flex-col gap-8">
      {!isReadonly && (
        <Button icon="add-line" size="sm" onClick={() => createFicheResume()}>
          Créer une fiche action
        </Button>
      )}

      <Field title="Fiches des plans liées">
        <FichesActionsDropdown
          disabled={isReadonly}
          ficheCouranteId={null}
          values={fiches.map((f) => f.id.toString())}
          onChange={({ fiches: nouvellesFiches }) =>
            updateFichesActionLiees({ fiches, fiches_liees: nouvellesFiches })
          }
        />
      </Field>

      <FichesLieesListe fiches={fiches} />
    </div>
  );
};
