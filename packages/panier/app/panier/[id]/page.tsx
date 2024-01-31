import React from "react";
import {
  Categorie,
  panierSelect,
} from "@tet/api/dist/src/panier_action_impact/index";
import { PanierActionImpact } from "@tet/api";
import PanierRealtime from "@components/panier/panier-realtime";
import { notFound } from "next/navigation";
import { supabase } from "lib/supabaseServer";

async function Panier({ params }: { params: { id: string } }) {
  const panierId = params.id;
  const { data, error } = await supabase.from("panier")
    .select(panierSelect)
    .eq("id", panierId).single<PanierActionImpact.Panier>();

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

async function fetchCategories(): Promise<Categorie[]> {
  const response = await fetch(`${apiUrl}/rest/v1/action_impact_categorie`, {
    // todo @derfurth: use cache
    cache: "no-store",
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
  return await response.json();
}
