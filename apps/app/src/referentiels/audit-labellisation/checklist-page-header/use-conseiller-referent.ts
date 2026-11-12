import {
  Membre,
  useListMembres,
} from '@/app/collectivites/membres/list-membres/use-list-membres';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { groupeParFonction } from '@/app/referentiels/tableau-de-bord/referents/useMembres';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import {
  useCollectiviteId,
  useCurrentCollectivite,
} from '@tet/api/collectivites';

export const useConseillerReferent = (): {
  conseillers: Membre[];
  referents: Membre[];
  areConseillersLoading: boolean;
  isReadOnly: boolean;
  isMutating: boolean;
  saveConseillers: (userIds: string[]) => void;
} => {
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();
  const { hasCollectivitePermission, hasReferentielPermission } =
    useCurrentCollectivite();
  // Même règle d'affichage que l'élu et le référent technique voisins
  // (référentiel archivé = lecture seule), plus le droit de désigner.
  const isReadOnly = !(
    hasCollectivitePermission(
      'collectivites.membres.mutate_conseillers_referents'
    ) && hasReferentielPermission('referentiels.mutate', referentielId)
  );

  const { data: membres, isLoading: areConseillersLoading } = useListMembres();
  const conseillers = groupeParFonction(membres ?? [])?.conseiller ?? [];
  const referents = conseillers.filter((membre) => membre.estReferent);

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { mutate: updateConseillersReferents, isPending: isMutating } =
    useMutation(
      trpc.collectivites.membres.updateConseillersReferents.mutationOptions({
        // Aussi en cas d'erreur : la liste affichée peut être périmée
        onSettled: () =>
          queryClient.invalidateQueries({
            queryKey: trpc.collectivites.membres.list.queryKey({
              collectiviteId,
            }),
          }),
      })
    );

  const saveConseillers = (userIds: string[]): void => {
    const current = new Set(referents.map((membre) => membre.userId));
    const next = new Set(userIds);
    // Sélection inchangée : ni écriture, ni événement NPS
    if (
      next.size === current.size &&
      [...next].every((id) => current.has(id))
    ) {
      return;
    }
    updateConseillersReferents({ collectiviteId, userIds });
  };

  return {
    conseillers,
    referents,
    areConseillersLoading,
    isReadOnly,
    isMutating,
    saveConseillers,
  };
};
