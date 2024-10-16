import { supabaseClient } from 'core-logic/api/supabase';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { useQuery } from 'react-query';

type OpenDataIndicateur = {
  indicateur_id: number;
  metadonnee_id: number | null;
};

type OpenDataIndicateurWithCategorie = {
  indicateur_id: number;
  categorie_tag: {
    nom: Categorie | string;
  };
};

type Categorie = 'cae' | 'eci';

export const useOpenDataIndicateursCount = (categorie: Categorie) => {
  console.log('categ', categorie);
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
  categorie: Categorie
): Promise<OpenDataIndicateurWithCategorie[]> => {
  const openDataIndicateurs = await fetchOpenDataIndicateurs(collectivite_id);
  console.log('openDataIndicateurs');
  console.log(openDataIndicateurs);

  const openDataIndicateursWithCategorie =
    await fetchOpenDataIndicateursByCategorie(
      buildKeys(openDataIndicateurs),
      categorie
    );
  console.log('openDataIndicateursWithCategorie');
  console.log(openDataIndicateursWithCategorie);

  return openDataIndicateursWithCategorie;
};

/**
 * Only open data indicateurs have metadonnee_id, so we use this column.
 */
const fetchOpenDataIndicateurs = async (
  collectivite_id: number
): Promise<OpenDataIndicateur[]> => {
  const { error: indicateurError, data: indicateurData } = await supabaseClient
    .from('indicateur_valeur')
    .select(
      `indicateur_id,
      metadonnee_id`
    )
    .match({ collectivite_id })
    .not('metadonnee_id', 'is', null); // magic happens here

  if (indicateurError) throw new Error(indicateurError.message);

  return indicateurData;
};

const buildKeys = (indicateurs: OpenDataIndicateur[]): number[] => {
  const indicateurIds = indicateurs
    ? Array.from(new Set(indicateurs.map((indic) => indic.indicateur_id)))
    : [];

  return indicateurIds;
};

const fetchOpenDataIndicateursByCategorie = async (
  indicateurIds: number[],
  categorie: Categorie
): Promise<OpenDataIndicateurWithCategorie[]> => {
  const { error: categorieError, data: categorieTags } = await supabaseClient
    .from('indicateur_categorie_tag')
    .select(
      `indicateur_id,
      categorie_tag!inner(nom)`
    )
    .in('indicateur_id', indicateurIds)
    .match({ 'categorie_tag.nom': categorie });

  if (categorieError) throw new Error(categorieError.message);

  return categorieTags;
};
