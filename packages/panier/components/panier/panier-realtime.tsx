'use client';

import {ReactNode, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {PanierActionImpact} from '@tet/api';
import {supabase} from 'lib/supabaseClient';
import {
  ActionImpact,
  ActionImpactStatut,
} from '@tet/api/dist/src/panier_action_impact/index';

export default function PanierRealtime({panier}: {
  panier: PanierActionImpact.Panier
}) {
  const router = useRouter();

  useEffect(() => {
    const channel = supabase.channel('realtime todos').on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'panier',
        filter: `id=eq.${panier.id}`,
      },
      (payload) => {
        router.refresh();
      },
    ).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router, panier.id]);

  return (
    <div>
      <h2>Actions</h2>
      {panier.states.map((state) =>
        <ActionImpactCard key={state.action.id} action={state.action}>
          <ActionCardStatutBar
            action={state.action}
            statut={state.statut}
            onAdd={async () => {
              await supabase.from(
                'action_impact_panier').
                insert({'action': state.action.id, 'panier': panier.id});
            }}
            onStatut={(statut) => {}}
            isInPanier={state.isinpanier} />
        </ActionImpactCard>)}

      <h2>Panier</h2>
      {panier.contenu.map((action) =>
        <ActionImpactCard key={action.id} action={action} isInPanier>
          <ActionCardRemoveBar
            action={action}
            onRemove={async () => {
              await supabase.from(
                'action_impact_panier').
                delete().
                eq('action', action.id).
                eq('panier', panier.id);
            }} />
        </ActionImpactCard>)}
    </div>
  );
}

function ActionImpactCard({action, isInPanier, children}: {
  action: ActionImpact,
  isInPanier?: boolean,
  children?: ReactNode
}) {
  return (
    <div>
      <h4>{action.titre}</h4>
      {children}
    </div>
  );
}

function ActionCardRemoveBar({action, onRemove}: {
  action: ActionImpact,
  onRemove: () => void
}) {

  return (
    <div>
      <button onClick={onRemove}>Retirer du panier</button>
    </div>
  );
}

function ActionCardStatutBar({action, statut, onAdd, isInPanier}: {
  action: ActionImpact,
  statut: ActionImpactStatut | null,
  isInPanier?: boolean,
  onAdd: () => void
  onStatut: (statut: string | null) => void
}) {
  const categorie = !statut ? '' : statut.categorie;

  return (
    <div>
      <h5>{categorie}</h5>
      <div>
        <button onClick={onAdd} disabled={isInPanier}>Ajouter au panier</button>
      </div>
    </div>
  );
}

