import { useCurrentCollectivite } from '@/api/collectivites';
import { useUser } from '@/api/users/user-context/user-provider';
import FichesActionsDropdown from '@/app/ui/dropdownLists/FichesActionsDropdown/FichesActionsDropdown';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { Button, Field } from '@/ui';
import FichesLieesListe from '../../app/pages/collectivite/PlansActions/FicheAction/FichesLiees/FichesLieesListe';
import { useCreateFicheResume } from '../../app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheResume';
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
  const { id: currentUserId } = useUser();
  const { data: fiches, isLoading } = useFichesActionLiees({
    actionId,
    collectiviteId: collectivite.collectiviteId,
  });
  const { mutate: createFicheResume } = useCreateFicheResume({
    actionId,
    openInNewTab: true,
    collectiviteId: collectivite.collectiviteId,
  });
  const { mutate: updateFichesActionLiees } =
    useUpdateFichesActionLiees(actionId);
  const isReadonly = collectivite?.isReadOnly ?? false;

  return (
    <div className="flex flex-col gap-8">
      {!isReadonly &&
        hasPermission(collectivite.permissions, 'plans.fiches.create') && (
          <Button icon="add-line" size="sm" onClick={() => createFicheResume()}>
            Créer une fiche action
          </Button>
        )}

      <Field title="Fiches action">
        <FichesActionsDropdown
          disabled={isReadonly}
          ficheCouranteId={null}
          values={fiches.map((f) => f.id.toString())}
          onChange={({ fiches: nouvellesFiches }) =>
            updateFichesActionLiees({ fiches, fiches_liees: nouvellesFiches })
          }
        />
      </Field>

      <FichesLieesListe
        collectivite={collectivite}
        currentUserId={currentUserId}
        fiches={fiches}
        isLoading={isLoading}
      />
    </div>
  );
};
