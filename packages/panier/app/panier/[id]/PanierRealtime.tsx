/* eslint-disable react/no-unescaped-entities */
'use client';

import PanierActions from './PanierActions';
import ListeActions from './ListeActions';

import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {ActionImpactCategorie, Panier} from '@tet/api';
import {panierAPI, supabase} from 'src/clientAPI';
import {useEventTracker} from 'src/tracking/useEventTracker';

type PanierRealtimeProps = {
  panier: Panier;
  categories: ActionImpactCategorie[];
};

const PanierRealtime = ({panier, categories}: PanierRealtimeProps) => {
  const router = useRouter();

  // todo Passer le nom de l'onglet.
  const tracker = useEventTracker('panier', undefined);

  useEffect(() => {
    const channel = panierAPI.listenToPanierUpdates(panier.id, router.refresh);

    return () => {
      // @ts-ignore
      supabase.removeChannel(channel);
    };
  }, [router, panier.id]);

  const handleToggleSelected = async (actionId: number, selected: boolean) => {
    if (selected) {
      await panierAPI.addActionToPanier(actionId, panier.id);
      await tracker('ajout', {
        collectivite_preset: panier.collectivite_preset,
        panier_id: panier.id,
        action_id: actionId,
      });
      router.refresh();
    } else {
      await panierAPI.removeActionFromPanier(actionId, panier.id);
      await tracker('retrait', {
        collectivite_preset: panier.collectivite_preset,
        panier_id: panier.id,
        action_id: actionId,
      });
      router.refresh();
    }
  };

  const handleUpdateStatus = async (
    actionId: number,
    statusId: string | null,
  ) => {
    await panierAPI.setActionStatut(actionId, panier.id, statusId);
    router.refresh();
  };

  return (
    <div
      style={{height: 'calc(100vh - 128px)'}}
      className="grow grid lg:grid-cols-3 gap-8 max-lg:!h-full max-lg:mb-6 "
    >
      <div
        style={{height: 'calc(100vh - 128px)'}}
        className="lg:col-span-2 max-lg:!h-full overflow-y-scroll py-12"
      >
        <h1>
          Initiez{' '}
          <span className="text-secondary-1">des actions impactantes</span> et
          valorisez le chemin déjà parcouru
        </h1>
        <p className="text-grey-9 text-lg font-medium mt-8 mb-12">
          Vous pouvez les ajouter à votre panier ou les définir comme déjà
          réalisées ou non pertinentes, auquel cas nous vous proposerons
          d'autres actions.
        </p>
        <ListeActions
          actionsListe={panier.states}
          onToggleSelected={handleToggleSelected}
          updateStatus={handleUpdateStatus}
        />
      </div>

      <PanierActions
        actionsListe={panier.contenu}
        onToggleSelected={handleToggleSelected}
      />
    </div>
  );
};

export default PanierRealtime;
