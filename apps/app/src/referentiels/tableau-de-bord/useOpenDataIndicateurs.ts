import { DBClient } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { ReferentielId } from '@/domain/referentiels';
import { useQuery } from '@tanstack/react-query';

type OpenDataIndicateur = {
  indicateurId: number;
  metadonneeId: number | null;
};

export const useOpenDataIndicateursCount = (categorie: ReferentielId) => {
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['open_data_indicateurs_count', collectiviteId, categorie],

    queryFn: async () => {
      if (!collectiviteId) return;
      const indicateurs = await buildOpenDataIndicateursByCategorie(
        supabase,
        collectiviteId,
        categorie
      );
      return indicateurs.length;
    },
  });
};

const buildOpenDataIndicateursByCategorie = async (
  supabase: DBClient,
  collectivite_id: number,
  categorie: ReferentielId
) => {
  const openDataIndicateurs = await fetchOpenDataIndicateurs(
    supabase,
    collectivite_id
  );

  const openDataIndicateursWithCategorie =
    await fetchOpenDataIndicateursByCategorie(
      supabase,
      buildKeys(openDataIndicateurs),
      categorie
    );

  return openDataIndicateursWithCategorie;
};

/**
 * Only open data indicateurs have metadonnee_id, so we use this column to fetch them.
 */
const fetchOpenDataIndicateurs = async (
  supabase: DBClient,
  collectivite_id: number
) => {
  try {
    const { error, data } = await supabase
      .from('indicateur_valeur')
      .select(
        `indicateur_id,
        metadonnee_id`
      )
      .match({ collectivite_id })
      .not('metadonnee_id', 'is', null); // magic happens here

    if (error) throw new Error(error.message);

    return data.map((item: any) => ({
      indicateurId: item.indicateur_id,
      metadonneeId: item.metadonnee_id,
    }));
  } catch (error) {
    console.error('Error fetching open data indicateurs:', error);
    return [];
  }
};

const buildKeys = (indicateurs: OpenDataIndicateur[]): number[] => {
  const indicateurIds = indicateurs
    ? Array.from(new Set(indicateurs.map((indic) => indic.indicateurId)))
    : [];

  return indicateurIds;
};

const fetchOpenDataIndicateursByCategorie = async (
  supabase: DBClient,
  indicateurIds: number[],
  categorie: ReferentielId
) => {
  try {
    const { error, data } = await supabase
      .from('indicateur_categorie_tag')
      .select(
        `indicateur_id,
        categorie_tag!inner(nom)`
      )
      .in('indicateur_id', indicateurIds)
      .match({ 'categorie_tag.nom': categorie });

    if (error) throw new Error(error.message);

    return data;
  } catch (error) {
    console.error('Error fetching open data indicateurs by category:', error);
    return [];
  }
};
