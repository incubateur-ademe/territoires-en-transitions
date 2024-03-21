import {
  ActionImpactCategorie,
  ActionImpactThematique,
  Niveau,
  Panier,
  PanierAPI,
} from '@tet/api';
import {cookies} from 'next/headers';
import {createClient} from 'src/supabase/server';

const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const getInit = {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    apiKey: apiKey,
  },
};

export const fetchPanier = async (
  panierId: string,
  thematique_ids: number[],
  budget_ids: number[],
  match_competences: boolean
): Promise<Panier | null> => {
  const supabase = createClient(cookies());
  // @ts-ignore
  const api = new PanierAPI(supabase);

  const panier: Panier | null = await api.fetchPanier(
    panierId,
    thematique_ids,
    budget_ids,
    [],
    match_competences
  );

  return panier;
};

export const fetchCategories = async (): Promise<ActionImpactCategorie[]> => {
  const response = await fetch(
    `${apiUrl}/rest/v1/action_impact_categorie`,
    getInit
  );
  return await response.json();
};

export const fetchThematiques = async (): Promise<ActionImpactThematique[]> => {
  const response = await fetch(
    `${apiUrl}/rest/v1/thematique?select=id,nom`,
    getInit
  );
  return await response.json();
};

export const fetchNiveaux = async (
  table:
    | 'action_impact_complexite'
    | 'action_impact_fourchette_budgetaire'
    | 'action_impact_tier'
    | 'action_impact_temps_mise_en_oeuvre'
): Promise<Niveau[]> => {
  const response = await fetch(`${apiUrl}/rest/v1/${table}`, getInit);
  return await response.json();
};
