import { appLabels } from '@/app/labels/catalog';
import { useSaveActionStatuts } from '@/app/referentiels/actions/action-statut/use-action-statut';
import {
  useDeleteMesurePilotes,
  useListMesurePilotes,
  useUpsertMesurePilotes,
} from '@/app/referentiels/actions/use-mesure-pilotes';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { captureException } from '@/app/utils/sentry/sentry-client.lazy';
import { useToastContext } from '@/app/utils/toast/toast-context';
import {
  useCollectiviteId,
  useCurrentCollectivite,
} from '@tet/api/collectivites';
import { PersonneTagOrUser } from '@tet/domain/collectivites';
import { ActionId, StatutAvancementEnum } from '@tet/domain/referentiels';
import { propagateStatutToTaches } from './propagate-statut-to-taches';
import { useGetSousActionOfTache } from './use-get-sous-action-of-tache';

type MesurePilotes = ReturnType<typeof useListMesurePilotes>['data'];

export const useRoleMesure = (
  actionId: ActionId
): {
  pilotes: MesurePilotes;
  isLoading: boolean;
  isReadOnly: boolean;
  isMutating: boolean;
  saveRoleMesure: (personnes: PersonneTagOrUser[]) => Promise<void>;
} => {
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();
  const { hasReferentielPermission } = useCurrentCollectivite();
  const isReadOnly = !hasReferentielPermission(
    'referentiels.mutate',
    referentielId
  );

  const { data: pilotes, isLoading: arePilotesLoading } =
    useListMesurePilotes(actionId);
  const { sousAction, isPending: isSousActionPending } =
    useGetSousActionOfTache(actionId);

  const { mutateAsync: upsertPilotes, isPending: isUpsertPending } =
    useUpsertMesurePilotes();
  const { mutateAsync: deletePilotes, isPending: isDeletePending } =
    useDeleteMesurePilotes();
  const { saveActionStatuts, isLoading: isStatutPending } =
    useSaveActionStatuts();
  const { setToast } = useToastContext();

  const isLoading = arePilotesLoading || isSousActionPending;
  const isMutating = isUpsertPending || isDeletePending || isStatutPending;

  const savePilotes = (personnes: PersonneTagOrUser[]): Promise<unknown> => {
    if (personnes.length === 0) {
      return deletePilotes({ collectiviteId, mesureId: actionId });
    }

    return upsertPilotes({
      collectiviteId,
      mesureId: actionId,
      pilotes: personnes.map((personne) => ({
        userId: personne.userId ?? null,
        tagId: personne.tagId ?? null,
      })),
    });
  };

  const saveRoleMesure = async (
    personnes: PersonneTagOrUser[]
  ): Promise<void> => {
    if (!sousAction) {
      setToast('error', appLabels.mutationError);
      return;
    }

    const statut =
      personnes.length === 0
        ? StatutAvancementEnum.NON_RENSEIGNE
        : StatutAvancementEnum.FAIT;

    try {
      await savePilotes(personnes);
      await saveActionStatuts({
        actionStatuts: propagateStatutToTaches({
          collectiviteId,
          tacheId: actionId,
          statut,
          sousAction,
        }),
      });
    } catch (error) {
      captureException({ error });
    }
  };

  return { pilotes, isLoading, isReadOnly, isMutating, saveRoleMesure };
};
