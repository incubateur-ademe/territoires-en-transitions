/* eslint-disable react/no-unescaped-entities */
'use client';

import PanierActions from './PanierActions';
import ListeActions from './ListeActions';

import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {
  ActionImpactCategorie,
  Panier,
} from '@tet/api';
import {panierAPI, supabase} from 'src/clientAPI';

type PanierRealtimeProps = {
  panier: Panier;
  categories: ActionImpactCategorie[];
};

const PanierRealtime = ({panier, categories}: PanierRealtimeProps) => {
  const router = useRouter();

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
      router.refresh();
    } else {
      await panierAPI.removeActionFromPanier(actionId, panier.id);
      router.refresh();
    }
  };

  const handleUpdateStatus = async (actionId: number, statusId: string | null) => {
    await panierAPI.setActionStatut(actionId, panier.id, statusId);
    router.refresh();
  };

  return (
    <div className="grow grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <h1 className="mt-12">
          Initiez{' '}
          <span className="text-secondary-1">des actions impactantes</span> et
          valorisez le chemin déjà parcouru
        </h1>
        <p className="text-grey-9 text-lg font-medium my-8">
          Vous pouvez les ajouter à votre panier ou les définir comme déjà
          réalisées ou non pertinentes, auquel cas nous vous proposerons
          d'autres actions.
        </p>
        <ListeActions
          actionsListe={panier.states}
          statuts={categories}
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
