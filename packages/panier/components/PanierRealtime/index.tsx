'use client';

import {ReactNode, useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {
  ActionImpact,
  ActionImpactCategorie,
  ActionImpactStatut,
  Panier,
} from '@tet/api';
import {supabase} from 'lib/supabaseClient';
import ActionImpactDetails from '@components/ActionImpactDetails/index';

export default function PanierRealtime({panier, categories}: {
  panier: Panier;
  categories: ActionImpactCategorie[];
}) {
  const router = useRouter();
  const [modalActionId, setModalActionId] = useState<null | number>(null);
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
      {!modalActionId ? null :
        <div style={{background: 'gainsboro'}}>
          <button onClick={() => setModalActionId(null)}>X</button>
          <ActionImpactDetails id={modalActionId} />
        </div>
      }
      <h2>Actions</h2>
      {panier.states.map((state) => (
        <ActionImpactCard key={state.action.id}
                          action={state.action}
                          onOpen={() => setModalActionId(state.action.id)}>
          <ActionCardStatutBar
            statut={state.statut}
            categories={categories}
            onAdd={async () => {
              await supabase.from(
                'action_impact_panier',
              ).insert({
                'action_id': state.action.id,
                'panier_id': panier.id,
              });
            }}
            onCategory={async (category_id) => {
              if (category_id) {
                await supabase.from(
                  'action_impact_statut',
                ).upsert({
                  'action_id': state.action.id,
                  'panier_id': panier.id,
                  'categorie_id': category_id,
                });
              } else {
                await supabase.from(
                  'action_impact_statut',
                ).
                  delete().
                  eq('action_id', state.action.id).
                  eq('panier_id', panier.id);
              }
            }}
            isInPanier={state.isinpanier}
          />
        </ActionImpactCard>
      ))}

      <h2>Panier</h2>
      {panier.contenu.map((action) => (
        <ActionImpactCard key={action.id} action={action}
                          onOpen={() => setModalActionId(action.id)} isInPanier>
          <ActionCardRemoveBar
            action={action}
            onRemove={async () => {
              await supabase.from(
                'action_impact_panier',
              ).delete().eq('action_id', action.id).eq('panier_id', panier.id);
            }}
          />
        </ActionImpactCard>
      ))}
    </div>
  );
}

function ActionImpactCard(
  {action, isInPanier, onOpen, children}: {
    action: ActionImpact;
    isInPanier?: boolean;
    children?: ReactNode;
    onOpen: () => void;
  },
) {
  return (
    <div>
      <h4 onClick={onOpen} style={{cursor: 'pointer'}}>{action.titre}
        <span>{action.fourchette_budgetaire}</span></h4>
      {children}
    </div>
  );
}

function ActionCardRemoveBar({action, onRemove}: {
  action: ActionImpact;
  onRemove: () => void;
}) {
  return (
    <div>
      <button onClick={onRemove}>Retirer du panier</button>
    </div>
  );
}

function ActionCardStatutBar(
  {
    onCategory,
    categories,
    statut,
    onAdd,
    isInPanier,
  }: {
    statut: ActionImpactStatut | null;
    categories: ActionImpactCategorie[];
    isInPanier?: boolean;
    onAdd: () => void;
    onCategory: (category_id: string | null) => void;
  },
) {
  return (
    <div>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={statut?.categorie_id == category.id
            ? () => onCategory(null)
            : () => onCategory(category.id)}
        >
          {statut?.categorie_id == category.id ? 'X' : ''} {category.nom}
        </button>
      ))}
      <div>
        <button onClick={onAdd} disabled={isInPanier}>Ajouter au panier</button>
      </div>
    </div>
  );
}
