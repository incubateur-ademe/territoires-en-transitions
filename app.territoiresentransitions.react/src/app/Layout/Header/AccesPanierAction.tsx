import { useQuery } from 'react-query';
import { PanierAPI } from '@tet/api';
import { Button } from '@tet/ui';
import { supabaseClient } from 'core-logic/api/supabase';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { ENV } from 'environmentVariables';
import classNames from 'classnames';
import { makeCollectivitePanierUrl } from '@tet/app/paths';

const panierAPI = new PanierAPI(supabaseClient);

/**
 * Affiche un bouton d'accès au panier d'actions
 */
export const AccesPanierAction = () => {
  const collectiviteId = useCollectiviteId();
  const { data } = useNbActionsDansPanier(collectiviteId);
  const { panierId, count } = data || {};

  return (
    <Button
      variant="white"
      className={classNames('text-primary-9', { 'mr-2': !!count })}
      size="sm"
      icon="shopping-basket-2-line"
      notification={count ? { number: count, variant: 'info' } : undefined}
      onClick={() => {
        window.open(
          makeCollectivitePanierUrl({
            collectiviteId,
            panierId,
          }),
          '_blank'
        );
      }}
    >
      Panier d'action
    </Button>
  );
};

/**
 * Charge le nombre d'actions présentes dans le panier d'une collectivité
 */
export const useNbActionsDansPanier = (collectiviteId: number | null) => {
  return useQuery(['nb_actions_dans_panier', collectiviteId], async () => {
    if (!collectiviteId) return;
    return panierAPI.getCollectivitePanierInfo(collectiviteId);
  });
};
