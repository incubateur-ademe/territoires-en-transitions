'use server';

import React from 'react';
import {
  ActionImpactCategorie,
  ActionImpactThematique,
  Niveau,
  PanierAPI,
} from '@tet/api';
import PanierRealtime from './PanierRealtime';
import {notFound} from 'next/navigation';
import {cookies} from 'next/headers';
import {createClient} from 'src/supabase/server';
import dynamic from 'next/dynamic';
import Section from '@components/Section/Section';

const TrackPageView = dynamic(() => import('components/TrackPageView'), {
  ssr: false,
});

/**
 * La page d'un panier d'action
 *
 * @param params contient l'id du panier
 * @param searchParams contient les paramètres des filtres :
 *  - t pour les ids des thématiques ex : 1 ou 1,2
 *  - b pour les ids des fourchettes budgétaires ex : 1 ou 1,2
 *  - c pour utiliser les competences ex : true ou false (true par défaut)
 *
 *  Ainsi que le contrôle de la modale de "Création de plan d’action”
 *  - Si le paramètre `modale` est égal à `creation` la modale est initialement ouverte
 */
async function Page({
  params,
  searchParams,
}: {
  params: {id: string};
  searchParams: {[key: string]: string | string[] | undefined};
}) {
  const supabase = createClient(cookies());
  // @ts-ignore
  const api = new PanierAPI(supabase);

  const panierId = params.id;
  const thematique_ids = extractIdsFromParam(searchParams['t'] as string);
  const budget_ids = extractIdsFromParam(searchParams['b'] as string);
  const match_competences = searchParams['c'] !== 'false';

  const panier = await api.fetchPanier(
    panierId,
    thematique_ids,
    budget_ids,
    match_competences,
  );

  if (!panier) return notFound();

  const budgets = await fetchNiveaux('action_impact_fourchette_budgetaire');
  const categories = await fetchCategories();
  const thematiques = await fetchThematiques();

  return (
    <>
      <TrackPageView pageName="panier" />
      <Section>
        <PanierRealtime
          panier={panier}
          budgets={budgets}
          categories={categories}
          thematiques={thematiques}
        />
      </Section>
    </>
  );
}

export default Page;

function extractIdsFromParam(param: string | undefined): number[] {
  return param?.split(',').map(n => parseInt(n)) ?? [];
}

const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const getInit = {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    apiKey: apiKey,
  },
};

async function fetchCategories(): Promise<ActionImpactCategorie[]> {
  const response = await fetch(
    `${apiUrl}/rest/v1/action_impact_categorie`,
    getInit,
  );
  return await response.json();
}

async function fetchThematiques(): Promise<ActionImpactThematique[]> {
  const response = await fetch(
    `${apiUrl}/rest/v1/thematique?select=id,nom`,
    getInit,
  );
  return await response.json();
}

async function fetchNiveaux(
  table:
    | 'action_impact_complexite'
    | 'action_impact_fourchette_budgetaire'
    | 'action_impact_tier',
): Promise<Niveau[]> {
  const response = await fetch(`${apiUrl}/rest/v1/${table}`, getInit);
  return await response.json();
}
