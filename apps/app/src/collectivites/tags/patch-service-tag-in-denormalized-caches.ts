import { QueryClient } from '@tanstack/react-query';
import { AppRouter } from '@tet/api';
import { ActionId, ActionsGroupedById } from '@tet/domain/referentiels';
import { TRPCOptionsProxy } from '@trpc/tanstack-react-query';

/**
 * Met à jour le libellé dénormalisé des services pilotes
 * dans le cache `listActionsGroupedById` après un rename côté tags.
 */
export const patchServiceTagInDenormalizedCaches = ({
  queryClient,
  trpc,
  collectiviteId,
  tagId,
  nom,
}: {
  queryClient: QueryClient;
  trpc: TRPCOptionsProxy<AppRouter>;
  collectiviteId: number;
  tagId: number;
  nom: string;
}) => {
  queryClient.setQueriesData(
    trpc.referentiels.actions.listActionsGroupedById.queryFilter({
      collectiviteId,
    }),
    (oldValue: ActionsGroupedById | undefined) => {
      if (!oldValue) {
        return oldValue;
      }

      let changed = false;
      const nextValue: ActionsGroupedById = { ...oldValue };

      for (const actionId of Object.keys(nextValue) as ActionId[]) {
        const action = nextValue[actionId];
        if (!action.services.some((s) => s.id === tagId)) {
          continue;
        }

        changed = true;

        nextValue[actionId] = {
          ...action,
          services: action.services.map((s) =>
            s.id === tagId ? { ...s, nom } : s
          ),
        };
      }

      return changed ? nextValue : oldValue;
    }
  );

};
