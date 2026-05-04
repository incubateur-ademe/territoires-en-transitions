import { useListFichesGroupedByActionId } from '@/app/plans/fiches/data/use-list-fiches-grouped-by-action-id';
import FichesActionsDropdown from '@/app/ui/dropdownLists/FichesActionsDropdown/FichesActionsDropdown';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { Field } from '@tet/ui';
import { FichesLieesListe } from './fiches-liees.list';
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

  const { fichesByActionId = {}, isLoading } = useListFichesGroupedByActionId();

  const fiches = fichesByActionId[actionId] ?? [];

  const { mutate: updateFichesActionLiees } = useUpdateFichesActionLiees();

  const canEditReferentiel = hasCollectivitePermission('referentiels.mutate');

  return (
    <div className="flex flex-col gap-8">
      <Field title="Actions" small>
        <FichesActionsDropdown
          disabled={!canEditReferentiel}
          ficheCouranteId={null}
          values={fiches.map((f) => f.id.toString())}
          onChange={({ fiches: nouvellesFiches }) =>
            updateFichesActionLiees({
              actionId,
              collectiviteId,
              ficheIds: nouvellesFiches.map((f) => f.id),
            })
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
            ? (ficheId: number) =>
                updateFichesActionLiees({
                  actionId,
                  collectiviteId,
                  ficheIds: fiches
                    .filter((f) => f.id !== ficheId)
                    .map((f) => f.id),
                })
            : undefined
        }
      />
    </div>
  );
};
