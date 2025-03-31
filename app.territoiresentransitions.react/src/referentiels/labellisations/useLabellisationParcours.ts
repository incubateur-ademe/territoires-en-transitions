import { DBClient } from '@/api';
import { useUserSession } from '@/api/users/user-provider';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { trpc } from '@/api/utils/trpc/client';
import { ReferentielId } from '@/domain/referentiels';
import { useQuery } from 'react-query';
import { useSnapshotFlagEnabled } from '../use-snapshot';
import { TLabellisationParcours } from './types';

/**
 * charge les données du parcours
 * @deprecated use score from snapshots instead
 */
export const useLabellisationParcours = ({
  collectiviteId,
  referentielId,
}: {
  collectiviteId: number;
  referentielId: ReferentielId;
}) => {
  const FLAG_isSnapshotEnabled = useSnapshotFlagEnabled();
  const session = useUserSession();

  // Nouvelle méthode : charge les données du parcours depuis le snapshot
  const { data: parcoursListFromSnapshot } =
    trpc.referentiels.labellisations.getParcours.useQuery(
      {
        collectiviteId,
        referentielId,
      },
      {
        enabled:
          FLAG_isSnapshotEnabled &&
          Boolean(session?.user) &&
          !session!.user.is_anonymous,
        refetchOnWindowFocus: true,
      }
    );

  // @deprecated charge les données du parcours depuis client_scores
  const { data: parcoursList } = useAllLabellisationsParcours(
    collectiviteId,
    !FLAG_isSnapshotEnabled
  );

  if (FLAG_isSnapshotEnabled) {
    return parcoursListFromSnapshot
      ? {
          ...parcoursListFromSnapshot,
          collectivite_id: collectiviteId,
          referentiel: referentielId,
        }
      : null;
  }

  // extrait le parcours correspondant au référentiel courant
  return getReferentielParcours(parcoursList, referentielId);
};

// charge les données des parcours de tous les référentiels
const useAllLabellisationsParcours = (
  collectivite_id: number | null,
  enabled = true
) => {
  const supabase = useSupabase();
  return useQuery(
    ['labellisation_parcours', collectivite_id],
    () => fetchParcours(supabase, collectivite_id),
    { enabled }
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
  return data.map((p: unknown) => {
    const d = p as TLabellisationParcours;
    return {
      ...d,
      etoiles: parseInt(d.etoiles as unknown as string),
      critere_score: {
        ...d.critere_score,
        etoiles: parseInt(d.critere_score.etoiles as unknown as string),
      },
      criteres_action: d.criteres_action.map((c) => ({
        ...c,
        etoile: parseInt(c.etoile as unknown as string),
      })),
      collectivite_id, // on ajoute l'id qui n'est pas redonné par la vue
    } as TLabellisationParcours;
  });
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
