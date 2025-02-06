import { DBClient } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useQuery } from 'react-query';
import { TLabellisationParcours } from './types';
import { useSnapshotFlagEnabled } from '../use-snapshot';

/**
 * charge les données du parcours
 * @deprecated use score from snapshots instead
 */
export const useLabellisationParcours = ({
  collectivite_id,
  referentiel,
}: {
  collectivite_id: number | null;
  referentiel: string | null;
}) => {
  const FLAG_isSnapshotEnabled = useSnapshotFlagEnabled();

  // charge les données du parcours
  const { data: parcoursList } = useAllLabellisationsParcours(collectivite_id);

  // extrait le parcours correspondant au référentiel courant
  return getReferentielParcours(parcoursList, referentiel);
};

// charge les données des parcours de tous les référentiels
const useAllLabellisationsParcours = (collectivite_id: number | null) => {
  const supabase = useSupabase();
  return useQuery(['labellisation_parcours', collectivite_id], () =>
    fetchParcours(supabase, collectivite_id)
  );
};

// charge les parcours (eci/cae) de labellisation d'une collectivité donnée
const fetchParcours = async (
  supabase: DBClient,
  collectivite_id: number | null
): Promise<TLabellisationParcours[] | null> => {
  if (!collectivite_id) {
    return null;
  }

  const { data, error } = await supabase
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

const getReferentielParcours = (
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
