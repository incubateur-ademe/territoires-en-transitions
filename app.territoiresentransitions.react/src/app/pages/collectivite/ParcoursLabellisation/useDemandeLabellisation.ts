import {LabellisationDemandeRead} from 'generated/dataLayer/labellisation_demande_read';
import {TEtoiles} from 'generated/dataLayer/labellisation_parcours_read';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useQuery} from 'react-query';
import {ReferentielParamOption} from 'app/paths';
import {supabaseClient} from 'core-logic/api/supabase';
import {Referentiel} from 'types/litterals';

/** Renvoie la demande de labellisation de la collectivité courante
 * (et la crée si elle n'existe pas)
 */
export const useDemandeLabellisation = (
  referentiel: ReferentielParamOption,
  etoiles?: TEtoiles
): LabellisationDemandeRead | null => {
  const collectivite_id = useCollectiviteId();

  const {data} = useQuery(
    ['labellisation_demande', collectivite_id, referentiel, etoiles],
    () => fetchDemande(collectivite_id, referentiel, etoiles)
  );

  return data || null;
};

// charge la demande (ou la crée) associée au parcours de labellisation d'une
// collectivité pour un référentiel et un niveau
export const fetchDemande = async (
  collectivite_id: number | null,
  referentiel: Referentiel | null,
  etoiles: TEtoiles | undefined
): Promise<LabellisationDemandeRead | null> => {
  if (!collectivite_id || !referentiel || !etoiles) {
    return null;
  }
  const {data, error} = await supabaseClient
    .rpc('labellisation_demande', {
      collectivite_id,
      referentiel,
      etoiles,
    })
    .select();

  if (error) {
    return null;
  }
  return (data as unknown as LabellisationDemandeRead) || null;
};
