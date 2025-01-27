import { supabaseClient } from '@/app/core-logic/api/supabase';
import { useQuery } from 'react-query';
import { TLabellisationParcours } from './types';

// charge les données du parcours
export const useLabellisationParcours = ({
  collectivite_id,
  referentiel,
}: {
  collectivite_id: number | null;
  referentiel: string | null;
}) => {
  // charge les données du parcours
  const { data: parcoursList } = useAllLabellisationsParcours(collectivite_id);

  // extrait le parcours correspondant au référentiel courant
  return getReferentielParcours(parcoursList, referentiel);
};

// charge les données des parcours de tous les référentiels
const useAllLabellisationsParcours = (collectivite_id: number | null) => {
  return useQuery(['labellisation_parcours', collectivite_id], () =>
    fetchParcours(collectivite_id)
  );
};

// charge les parcours (eci/cae) de labellisation d'une collectivité donnée
const fetchParcours = async (
  collectivite_id: number | null
): Promise<TLabellisationParcours[] | null> => {
  if (!collectivite_id) {
    return null;
  }

  const { data, error } = await supabaseClient
    .rpc('labellisation_parcours', {
      collectivite_id,
    })
    .select();

  if (error || !data) {
    return null;
  }
  return data.map((d) => ({
    ...d,
    collectivite_id, // on ajoute l'id qui n'est pas redonné par la vue
  })) as TLabellisationParcours[];
};

export const getReferentielParcours = (
  parcoursList: TLabellisationParcours[] | null | undefined,
  referentiel: string | null
) => {
  const parcours: TLabellisationParcours | undefined = parcoursList?.find(
    (p) => p.referentiel === referentiel
  );

  if (!parcours) {
    return null;
  }

  const { criteres_action } = parcours;
  return {
    ...parcours,
    // trie les critères action
    criteres_action: criteres_action.sort((a, b) => a.prio - b.prio),
  };
};
