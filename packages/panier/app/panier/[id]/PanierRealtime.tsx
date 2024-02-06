'use client';

import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {supabase} from 'lib/supabaseClient';
import {ActionImpactCategorie, Panier} from '@tet/api';
import PanierActions from './PanierActions';
import ListeActions from './ListeActions';

const addAction = async (panierId: string, actionId: number) => {
  await supabase.from('action_impact_panier').insert({
    action_id: actionId,
    panier_id: panierId,
  });
};

const removeAction = async (panierId: string, actionId: number) => {
  await supabase
    .from('action_impact_panier')
    .delete()
    .eq('action_id', actionId)
    .eq('panier_id', panierId);
};

const updateStatus = async (
  panierId: string,
  actionId: number,
  categoryId: string | null,
) => {
  if (categoryId) {
    await supabase.from('action_impact_statut').upsert({
      action_id: actionId,
      panier_id: panierId,
      categorie_id: categoryId,
    });
  } else {
    await supabase
      .from('action_impact_statut')
      .delete()
      .eq('action_id', actionId)
      .eq('panier_id', panierId);
  }
};

type PanierRealtimeProps = {
  panier: Panier;
  categories: ActionImpactCategorie[];
};

const PanierRealtime = ({panier, categories}: PanierRealtimeProps) => {
  const router = useRouter();

  useEffect(() => {
    const channel = supabase
      .channel('realtime todos')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'panier',
          filter: `id=eq.${panier.id}`,
        },
        payload => router.refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router, panier.id]);

  const handleToggleSelected = (actionId: number, selected: boolean) => {
    if (selected) {
      addAction(panier.id, actionId);
    } else {
      removeAction(panier.id, actionId);
    }
  };

  const handleUpdateStatus = (actionId: number, statusId: string | null) => {
    updateStatus(panier.id, actionId, statusId);
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
