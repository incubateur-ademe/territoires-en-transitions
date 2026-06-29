import {
  Membre,
  useListMembres,
} from '@/app/collectivites/membres/list-membres/use-list-membres';
import { useUpdateMembres } from '@/app/collectivites/membres/use-update-membres';
import { groupeParFonction } from '@/app/referentiels/tableau-de-bord/referents/useMembres';
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
  const { hasCollectivitePermission } = useCurrentCollectivite();
  const isReadOnly = !hasCollectivitePermission('collectivites.membres.mutate');

  const { data: membres, isLoading: areConseillersLoading } = useListMembres();
  const conseillers = groupeParFonction(membres ?? [])?.conseiller ?? [];
  const referents = conseillers.filter((membre) => membre.estReferent);

  const { mutate: updateMembres, isPending: isMutating } = useUpdateMembres();

  const saveConseillers = (userIds: string[]): void => {
    const toUpdate = conseillers
      .filter((membre) => membre.estReferent !== userIds.includes(membre.userId))
      .map((membre) => ({
        userId: membre.userId,
        estReferent: userIds.includes(membre.userId),
        collectiviteId,
      }));
    if (toUpdate.length > 0) {
      updateMembres(toUpdate);
    }
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
