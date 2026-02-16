import { supabase } from '@/site/app/initSupabase';
import Fuse from 'fuse.js';
import useSWR from 'swr';

export const useFilteredCollectivites = (search: string) => {
  return useSWR(`site_labellisation-filtered-${search}`, async () => {
    const query = supabase
      .from('site_labellisation')
      .select('collectivite_id, nom, code_siren_insee')
      .neq('code_siren_insee', '67482') // Evite un doublon pour la page de Strasbourg
      .order('nom');

    // Nous devons charger la liste entière pour pouvoir utiliser la recherche fuse.
    // Nous limitons la liste à 10 résultats quand l'utilisateur n'a pas encore
    // commencé sa recherche, pour éviter de charger trop de données.
    if (search.length === 0) {
      query.limit(10);
    }

    const { error, data } = await query;

    if (error) {
      throw new Error(`site_labellisation-filtered-${search}`);
    }

    if (!data || !data.length) {
      return null;
    }

    if (search.length) {
      const fuse = new Fuse(data, {
        keys: ['nom'],
        threshold: 0.3,
        shouldSort: true,
        ignoreLocation: true,
      });
      return {
        filteredCollectivites: fuse.search(search).map((r) => r.item) || [],
      };
    }

    return {
      filteredCollectivites: data || [],
    };
  });
};
