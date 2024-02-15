"use server";

import React from "react";
import {
  ActionImpactCategorie,
  Niveau,
  PanierAPI,
} from '@tet/api';
import PanierRealtime from './PanierRealtime';
import { notFound } from "next/navigation";
import {cookies} from 'next/headers';
import {createClient} from 'src/supabase/server';
import dynamic from 'next/dynamic';

const TrackPageView = dynamic(() => import('components/TrackPageView'), {
  ssr: false,
});

async function Page({ params, searchParams }: {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = createClient(cookies())
  // @ts-ignore
  const api = new PanierAPI(supabase);
  const panierId = params.id;
  const panier = await api.fetchPanier(panierId)

  const categories = await fetchCategories();

  if (!panier) return notFound();

  return <>
    <TrackPageView pageName="panier" />
    <PanierRealtime panier={panier} categories={categories} />
  </>;
}

export default Page;

const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

async function fetchCategories(): Promise<ActionImpactCategorie[]> {
  const response = await fetch(`${apiUrl}/rest/v1/action_impact_categorie`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      apiKey: apiKey,
    },
  });
  return await response.json();
}

async function fetchNiveaux(
  table:
    | "action_impact_complexite"
    | "action_impact_fourchette_budgetaire"
    | "action_impact_tier",
): Promise<Niveau[]> {
  const response = await fetch(`${apiUrl}/rest/v1/${table}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      apiKey: apiKey,
    },
  });
  return await response.json();
}
