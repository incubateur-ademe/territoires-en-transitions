import { appLabels } from '@/app/labels/catalog';
import { useListFichesGroupedByActionId } from '@/app/plans/fiches/data/use-list-fiches-grouped-by-action-id';
import FichesActionsDropdown from '@/app/ui/dropdownLists/FichesActionsDropdown/FichesActionsDropdown';
import { useReferentielModeById } from '@/app/referentiels/referentiel-mode/use-referentiel-mode';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { canMutateReferentielData } from '@tet/domain/collectivites';
import { useUser } from '@tet/api/users';
import { getReferentielIdFromActionId } from '@tet/domain/referentiels';
import { Field } from '@tet/ui';
import { capitalize } from '@tet/ui/labels/plural';
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

  // Lier ou délier une fiche revient à modifier la fiche. Sur un référentiel
  // archivé ou en lecture seule, le bloc est en consultation : les liens se
  // gèrent depuis la fiche.
  const canEditFiches = hasCollectivitePermission('plans.fiches.update');
  const referentielMode = useReferentielModeById(
    getReferentielIdFromActionId(actionId)
  );
  const isReferentielWritable =
    referentielMode === null || canMutateReferentielData(referentielMode);
  const canEditLinks = canEditFiches && isReferentielWritable;

  return (
    <div className="flex flex-col gap-8">
      <Field title={capitalize(appLabels.actionLiee({ plural: true }))} small>
        {isReferentielWritable ? (
          <FichesActionsDropdown
            disabled={!canEditFiches}
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
        ) : (
          !isLoading &&
          fiches.length === 0 && (
            <p className="mb-0 text-sm text-grey-6">
              {appLabels.aucuneActionLiee}
            </p>
          )
        )}
      </Field>

      <FichesLieesListe
        collectivite={collectivite}
        currentUserId={currentUserId}
        fiches={fiches}
        isLoading={isLoading}
        onUnlink={
          canEditLinks
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
