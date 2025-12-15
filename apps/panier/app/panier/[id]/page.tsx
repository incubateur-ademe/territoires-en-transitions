import { extractIdsFromParam } from '@/panier/src/utils/extractIdsFromParam';
import { PostHogPageView } from '@tet/ui';
import { notFound } from 'next/navigation';
import PagePanier from './PagePanier';
import {
  fetchNiveaux,
  fetchPanier,
  fetchThematiques,
  fetchTypologies,
} from './utils';

/**
 * La page d'un panier d'action
 *
 * @param params contient l'id du panier
 * @param searchParams contient les paramètres des filtres :
 *  - t pour les ids des thématiques ex : 1 ou 1,2
 *  - b pour les ids des fourchettes budgétaires ex : 1 ou 1,2
 *  - m pour les ids de temps de mise en oeuvre ex : 1 ou 1,2
 *  - c pour ne pas restreindre aux compétences territoriales ex : true ou false (false par défaut)
 *
 *  Ainsi que le contrôle de la modale de "Création de plan”
 *  - Si le paramètre `modale` est égal à `creation` la modale est initialement ouverte
 */
async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id: panierId } = await params;
  const filtreParams = await searchParams;

  const filtre = {
    thematique_ids: extractIdsFromParam(filtreParams['t'] as string),
    typologie_ids: extractIdsFromParam(filtreParams['ty'] as string),
    niveau_budget_ids: extractIdsFromParam(filtreParams['b'] as string),
    niveau_temps_ids: extractIdsFromParam(filtreParams['m'] as string),
    matches_competences: filtreParams['c'] !== 'true',
  };
  const panier = await fetchPanier({ panierId, filtre });

  if (!panier) return notFound();

  const budgets = await fetchNiveaux('action_impact_fourchette_budgetaire');
  const temps = await fetchNiveaux('action_impact_temps_de_mise_en_oeuvre');
  const thematiques = await fetchThematiques();
  const typologies = await fetchTypologies();

  return (
    <>
      <PostHogPageView
        properties={{
          collectiviteId: panier.collectivite_preset,
          panier_id: panier.id,
        }}
      />
      <PagePanier
        {...{
          panier,
          budgets,
          temps,
          thematiques,
          typologies,
        }}
      />
    </>
  );
}

export default Page;
