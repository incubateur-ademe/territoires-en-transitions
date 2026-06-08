import { appLabels } from '@/app/labels/catalog';
import { useUpdateActionStatut } from '@/app/referentiels/actions/action-statut/use-update-action-statut';
import {
  useDeleteMesurePilotes,
  useListMesurePilotes,
  useUpsertMesurePilotes,
} from '@/app/referentiels/actions/use-mesure-pilotes';
import { useToastContext } from '@/app/utils/toast/toast-context';
import {
  useCollectiviteId,
  useCurrentCollectivite,
} from '@tet/api/collectivites';
import { PersonneTagOrUser } from '@tet/domain/collectivites';
import { ActionId } from '@tet/domain/referentiels';

type MesurePilotes = ReturnType<typeof useListMesurePilotes>['data'];

export const useRoleMesure = (
  actionId: ActionId
): {
  pilotes: MesurePilotes;
  arePilotesLoading: boolean;
  isReadOnly: boolean;
  isMutating: boolean;
  saveRoleMesure: (personnes: PersonneTagOrUser[]) => void;
} => {
  const collectiviteId = useCollectiviteId();
  const { hasCollectivitePermission } = useCurrentCollectivite();
  const isReadOnly = !hasCollectivitePermission('referentiels.mutate');

  const { data: pilotes, isLoading: arePilotesLoading } =
    useListMesurePilotes(actionId);
  const { mutate: upsertPilotes, isPending: isUpsertPending } =
    useUpsertMesurePilotes();
  const { mutate: deletePilotes, isPending: isDeletePending } =
    useDeleteMesurePilotes();
  const { mutate: updateActionStatut, isPending: isStatutPending } =
    useUpdateActionStatut();
  const { setToast } = useToastContext();

  const isMutating = isUpsertPending || isDeletePending || isStatutPending;

  const onMutationError = (): void =>
    setToast('error', appLabels.mutationError);

  const saveStatut = (avancement: 'fait' | 'non_renseigne'): void =>
    updateActionStatut({ actionId, statut: avancement });

  const saveRoleMesure = (personnes: PersonneTagOrUser[]): void => {
    if (personnes.length === 0) {
      deletePilotes(
        { collectiviteId, mesureId: actionId },
        {
          onSuccess: () => saveStatut('non_renseigne'),
          onError: onMutationError,
        }
      );
      return;
    }
    upsertPilotes(
      {
        collectiviteId,
        mesureId: actionId,
        pilotes: personnes.map((p) => ({
          userId: p.userId ?? null,
          tagId: p.tagId ?? null,
        })),
      },
      {
        onSuccess: () => saveStatut('fait'),
        onError: onMutationError,
      }
    );
  };

  return { pilotes, arePilotesLoading, isReadOnly, isMutating, saveRoleMesure };
};
