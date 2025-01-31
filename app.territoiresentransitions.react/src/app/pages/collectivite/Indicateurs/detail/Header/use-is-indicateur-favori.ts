import { Indicateurs } from '@/api';
import { supabaseClient } from '@/app/core-logic/api/supabase';
import { useQuery } from 'react-query';

/** Détermine si un indicateur est favoris de la collectivité */
export const useIsIndicateurFavori = (indicateurId: number) => {
  return useQuery(['indicateur_favori', indicateurId], async () =>
    Indicateurs.fetch.selectIndicateurFavori(supabaseClient, indicateurId)
  );
};
