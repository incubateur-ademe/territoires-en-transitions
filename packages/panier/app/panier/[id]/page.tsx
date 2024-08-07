'use server';

import React from 'react';
import {notFound} from 'next/navigation';
import dynamic from 'next/dynamic';
import {extractIdsFromParam} from 'src/utils/extractIdsFromParam';
import {fetchNiveaux, fetchPanier, fetchThematiques} from './utils';
import PagePanier from './PagePanier';

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
 *  - m pour les ids de temps de mise en oeuvre ex : 1 ou 1,2
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
  const panierId = params.id;
  const thematique_ids = extractIdsFromParam(searchParams['t'] as string);
  const budget_ids = extractIdsFromParam(searchParams['b'] as string);
  const temps_ids = extractIdsFromParam(searchParams['m'] as string);
  // const match_competences = searchParams['c'] !== 'false';

  const panier = await fetchPanier(
    panierId,
    thematique_ids,
    budget_ids,
    temps_ids,
  );

  if (!panier) return notFound();

  const budgets = await fetchNiveaux('action_impact_fourchette_budgetaire');
  const temps = await fetchNiveaux('action_impact_temps_de_mise_en_oeuvre');
  const thematiques = await fetchThematiques();

  return (
    <>
      <TrackPageView
        pageName="panier/panier"
        // @ts-ignore : l'import dynamique du composant semble générer une
        // erreur de typage erronée sur la ligne suivante (en important
        // directement le composant depuis @tet/ui l'erreur disparait, mais on
        // ne peut pas le faire car le wrapping avec la directive `'use client'`
        // est nécessaire)
        properties={{
          collectivite_preset: panier.collectivite_preset,
          panier_id: panier.id,
        }}
      />
      <PagePanier {...{panier, budgets, temps, thematiques}} />
    </>
  );
}

export default Page;
