import { useQuery } from 'react-query';

import { useApiClient } from 'core-logic/api/useApiClient';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { Statut } from '@tet/api/plan-actions';

export type GetFichesActionStatutsParams = {
  cibles?: string;
  partenaire_tag_ids?: string;
  pilote_tag_ids?: string;
  pilote_user_ids?: string;
  service_tag_ids?: string;
  plan_ids?: string;
  modified_since?: string;
};

type GetIndicateursValeursResponse = {
  par_statut: {
    [key: string]: {
      count: number;
      valeur: Statut;
    };
  };
};

/** Charge toutes les valeurs associées à un indicateur id (ou à un ou plusieurs identifiants d'indicateurs prédéfinis) */
export const useFichesActionStatuts = (
  params: GetFichesActionStatutsParams
) => {
  const collectivite_id = useCollectiviteId();
  const api = useApiClient();

  return useQuery(
    ['fiches_action_statuts', collectivite_id, params],
    async () => {
      if (!collectivite_id) return;

      return api.get<GetIndicateursValeursResponse>({
        route: `/collectivites/${collectivite_id}/fiches-action/synthese`,
        params: { collectivite_id, ...params },
      });
    }
  );
};
