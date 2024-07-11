import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {ValuesToUnion} from '@tet/api';

const CATEGORIES = ['cae', 'eci', 'perso'] as const;
type Categorie = ValuesToUnion<typeof CATEGORIES>;

/**
 * Récupère les summary des indicateurs d'une catégorie et d'une collectivité données
 */
const fetchIndicateurSummary = async (collectivite_id: number) => {
  const {error, data} = await supabaseClient
    .from('indicateur_summary')
    .select('*')
    .match({collectivite_id});

  if (error) throw new Error(error.message);

  return data.filter(
    s => s.categorie && CATEGORIES.includes(s.categorie as Categorie)
  );
};

/**
 * Récupère les summary des indicateurs d'un groupe et d'une collectivité données
 */
const useIndicateurSummary = () => {
  const collectiviteId = useCollectiviteId();

  return useQuery(['indicateur_summary', collectiviteId], () => {
    if (!collectiviteId) return;
    return fetchIndicateurSummary(collectiviteId);
  });
};

/**
 * Renvoie les compteurs pour tous les indicateurs
 */
export const useIndicateursCount = () => {
  const {data, isLoading} = useIndicateurSummary();

  if (isLoading || !data) {
    return;
  }

  const parCategorie = new Map();
  data?.forEach(d => {
    parCategorie.set(d.categorie, {total: d.nombre, withValue: d.rempli});
  });
  return Object.fromEntries(parCategorie.entries()) as Record<
    Categorie,
    {total: number; withValue: number}
  >;
};
