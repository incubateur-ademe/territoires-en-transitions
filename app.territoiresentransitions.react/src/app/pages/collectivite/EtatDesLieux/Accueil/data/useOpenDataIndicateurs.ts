import { ValuesToUnion } from '@tet/api';
import { supabaseClient } from 'core-logic/api/supabase';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { useQuery } from 'react-query';

type OpenDataIndicateur = {
  indicateur_id: number;
  metadonnee_id: number | null;
};

type OpenDataIndicateurWithReferentiel = {
  indicateur_id: number;
  categorie_tag: {
    nom: string;
  };
};

const CATEGORIES = ['cae', 'eci'] as const;
type Categorie = ValuesToUnion<typeof CATEGORIES>;

export const useOpenDataIndicateurs = (referentiel: Categorie) => {
  const collectiviteId = useCollectiviteId();

  return useQuery(['open_data_indicateurs', collectiviteId], () => {
    if (!collectiviteId) return;
    return fetchOpenDataIndicateursByReferentiel(collectiviteId, referentiel);
  });
};

export const useOpenDataIndicateursCount = (referentiel: Categorie) => {
  const collectiviteId = useCollectiviteId();

  return useQuery(['open_data_indicateurs_count', collectiviteId], async () => {
    if (!collectiviteId) return;
    const indicateurs = await fetchOpenDataIndicateursByReferentiel(
      collectiviteId,
      referentiel
    );
    return indicateurs.length;
  });
};

const fetchOpenDataIndicateursByReferentiel = async (
  collectivite_id: number,
  referentiel: Categorie
) => {
  const openDataIndicateurs = await fetchOpenDataIndicateurs(collectivite_id);
  console.log('openDataIndicateurs');
  console.log(openDataIndicateurs);

  const openDataIndicateursWithReferentiel =
    await fetchOpenDataIndicateursWithReferentiel(
      buildFilter(openDataIndicateurs),
      referentiel
    );
  console.log('openDataIndicateursWithReferentiel');
  console.log(openDataIndicateursWithReferentiel);

  return openDataIndicateursWithReferentiel;
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

const buildFilter = (indicateurs: OpenDataIndicateur[]): number[] => {
  const indicateurIds = indicateurs
    ? Array.from(new Set(indicateurs.map((indic) => indic['indicateur_id'])))
    : [];

  console.log(indicateurIds);
  return indicateurIds;
};

const fetchOpenDataIndicateursWithReferentiel = async (
  indicateurIds: number[],
  referentiel: Categorie
): Promise<OpenDataIndicateurWithReferentiel[]> => {
  const { error: categorieError, data: categorieTags } = await supabaseClient
    .from('indicateur_categorie_tag')
    .select(
      `indicateur_id,
      categorie_tag!inner(nom)`
    )
    .in('indicateur_id', indicateurIds)
    .match({ 'categorie_tag.nom': referentiel });

  if (categorieError) throw new Error(categorieError.message);

  return categorieTags;
};
