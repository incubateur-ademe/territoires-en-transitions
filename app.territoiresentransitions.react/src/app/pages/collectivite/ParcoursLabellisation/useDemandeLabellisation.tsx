import {LabellisationDemandeRead} from 'generated/dataLayer/labellisation_demande_read';
import {TEtoiles} from 'generated/dataLayer/labellisation_parcours_read';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {ReferentielParamOption} from 'app/paths';
import {useQuery} from 'react-query';
import {fetchDemande} from './queries';

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
