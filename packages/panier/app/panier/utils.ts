import {cookies} from 'next/headers';
import {ActionImpactCategorie, Niveau, Panier, panierSelect} from '@tet/api';
import {createServerClient} from 'lib/supabaseServer';

const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export const fetchPanier = async (panierId: string) => {
  const {supabase} = await createServerClient(cookies);

  const {data, error} = await supabase
    .from('panier')
    .select(panierSelect)
    .eq('id', panierId)
    .single<Panier>();

  if (error) {
    throw new Error(`panier-${panierId}`);
  }
  return data;
};

export const fetchCategories = async (): Promise<ActionImpactCategorie[]> => {
  const response = await fetch(`${apiUrl}/rest/v1/action_impact_categorie`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      apiKey: apiKey,
    },
  });
  return await response.json();
};

export const fetchNiveaux = async (
  table:
    | 'action_impact_complexite'
    | 'action_impact_fourchette_budgetaire'
    | 'action_impact_tier',
): Promise<Niveau[]> => {
  const response = await fetch(`${apiUrl}/rest/v1/${table}`, {
    cache: 'no-store',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      apiKey: apiKey,
    },
  });
  return await response.json();
};
