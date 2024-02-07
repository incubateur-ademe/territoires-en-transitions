"use server";

import React from "react";
import { ActionImpactCategorie, Niveau, Panier, panierSelect } from "@tet/api";
import PanierRealtime from "@components/PanierRealtime";
import { notFound } from "next/navigation";
import { createServerClient } from "lib/supabaseServer";
import {cookies} from 'next/headers';

async function Panier({ params, searchParams }: {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const {supabase} = await createServerClient(cookies)
  const panierId = params.id;
  const { data, error } = await supabase.from("panier")
    .select(panierSelect)
    .eq("id", panierId)
    .single<Panier>();

  const categories = await fetchCategories();

  if (data) {
    return (
      <div>
        <h1>Panier {panierId}</h1>
        <PanierRealtime panier={data!} categories={categories} />
      </div>
    );
  }
  return notFound();
}

export default Panier;

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
    cache: "no-store",
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      apiKey: apiKey,
    },
  });
  return await response.json();
}
