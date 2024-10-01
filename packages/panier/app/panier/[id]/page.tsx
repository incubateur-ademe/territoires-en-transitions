import { extractIdsFromParam } from '@tet/panier/src/utils/extractIdsFromParam';
import { notFound } from 'next/navigation';
import PagePanier from './PagePanier';
import { fetchNiveaux, fetchPanier, fetchThematiques, fetchTypologies } from './utils';
import { TrackPageView } from '@tet/ui';

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
 *  Ainsi que le contrôle de la modale de "Création de plan d’action”
 *  - Si le paramètre `modale` est égal à `creation` la modale est initialement ouverte
 */
async function Page({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const panierId = params.id;
  const thematique_ids = extractIdsFromParam(searchParams['t'] as string);
  const typologie_ids = extractIdsFromParam(searchParams['ty'] as string);
  const budget_ids = extractIdsFromParam(searchParams['b'] as string);
  const temps_ids = extractIdsFromParam(searchParams['m'] as string);
  const sansFiltreCompetences = searchParams['c'] === 'true';

  const panier = await fetchPanier({
    panierId,
    thematique_ids,
    typologie_ids,
    budget_ids,
    temps_ids,
  });

  if (!panier) return notFound();

  const budgets = await fetchNiveaux('action_impact_fourchette_budgetaire');
  const temps = await fetchNiveaux('action_impact_temps_de_mise_en_oeuvre');
  const thematiques = await fetchThematiques();
  const typologies = await fetchTypologies();

  return (
    <>
      <TrackPageView
        pageName="panier/panier"
        properties={{
          collectivite_preset: panier.collectivite_preset,
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
          sansFiltreCompetences,
        }}
      />
    </>
  );
}

export default Page;
