import { TActionDef } from '@/app/referentiels/preuves/usePreuves';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { ActionTypeEnum } from '@tet/domain/referentiels';

/**
 * Liste de options pour la sélection d'une sous-action
 */
export const useSubActionOptionsListe = (action: TActionDef) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();
  const { data: actions } = useQuery(
    trpc.referentiels.actions.listActionSummaries.queryOptions(
      {
        collectiviteId,
        referentielId: action.referentiel,
        identifiant: action.identifiant,
        actionTypes: [ActionTypeEnum.SOUS_ACTION],
      },
      {
        // il n'est pas nécessaire de recharger trop systématiquement ici, car
        // les référentiels ne changent pas fréquemment
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
      }
    )
  );

  return (actions || []).map(({ id, identifiant, nom }) => ({
    value: id,
    label: `${identifiant} ${nom}`,
  }));
};
