import { useQuery } from 'react-query';

import { Indicateurs } from '@/api';
import { supabaseClient } from '@/api/utils/supabase/browser-client';

/** Détermine si un indicateur est favoris de la collectivité */
export const useIsIndicateurFavori = (indicateurId: number) => {
  return useQuery(['indicateur_favori', indicateurId], async () =>
    Indicateurs.fetch.selectIndicateurFavori(supabaseClient, indicateurId)
  );
};
