import FichesActionsDropdown from '@/app/ui/dropdownLists/FichesActionsDropdown/FichesActionsDropdown';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { Button, Field } from '@tet/ui';
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
  const { collectiviteId, hasCollectivitePermission } = collectivite;

  const { id: currentUserId } = useUser();
  const { data: fiches, isLoading } = useFichesActionLiees({
    actionId,
    collectiviteId,
  });
  const { mutate: createFicheResume } = useCreateFicheResume({
    actionId,
    openInNewTab: true,
    collectiviteId,
  });
  const { mutate: updateFichesActionLiees } =
    useUpdateFichesActionLiees(actionId);

  const canEditReferentiel = hasCollectivitePermission('referentiels.mutate');
  const canCreateFiche = hasCollectivitePermission('plans.fiches.create');

  return (
    <div className="flex flex-col gap-8">
      {canCreateFiche && (
        <Button icon="add-line" size="sm" onClick={() => createFicheResume()}>
          Créer une action
        </Button>
      )}

      <Field title="Actions">
        <FichesActionsDropdown
          disabled={!canEditReferentiel}
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
        onUnlink={
          canEditReferentiel
            ? (ficheId) =>
                updateFichesActionLiees({
                  fiches: fiches,
                  fiches_liees: fiches.filter((f) => f.id !== ficheId),
                })
            : undefined
        }
      />
    </div>
  );
};
