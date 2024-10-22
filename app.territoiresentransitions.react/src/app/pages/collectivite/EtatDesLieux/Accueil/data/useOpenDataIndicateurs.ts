import { ReferentielParamOption } from '@tet/app/paths';
import { supabaseClient } from 'core-logic/api/supabase';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { useQuery } from 'react-query';

type OpenDataIndicateur = {
  indicateurId: number;
  metadonneeId: number | null;
};

export const useOpenDataIndicateursCount = (
  categorie: ReferentielParamOption
) => {
  const collectiviteId = useCollectiviteId();

  return useQuery(
    ['open_data_indicateurs_count', collectiviteId, categorie],
    async () => {
      if (!collectiviteId) return;
      const indicateurs = await buildOpenDataIndicateursByCategorie(
        collectiviteId,
        categorie
      );
      return indicateurs.length;
    }
  );
};

const buildOpenDataIndicateursByCategorie = async (
  collectivite_id: number,
  categorie: ReferentielParamOption
) => {
  const openDataIndicateurs = await fetchOpenDataIndicateurs(collectivite_id);

  const openDataIndicateursWithCategorie =
    await fetchOpenDataIndicateursByCategorie(
      buildKeys(openDataIndicateurs),
      categorie
    );

  return openDataIndicateursWithCategorie;
};

/**
 * Only open data indicateurs have metadonnee_id, so we use this column to fetch them.
 */
const fetchOpenDataIndicateurs = async (collectivite_id: number) => {
  try {
    const { error, data } = await supabaseClient
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
  indicateurIds: number[],
  categorie: ReferentielParamOption
) => {
  try {
    const { error, data } = await supabaseClient
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
