import {useEffect, useState} from 'react';
import {LabellisationDemandeRead} from 'generated/dataLayer/labellisation_demande_read';
import {TEtoiles} from 'generated/dataLayer/labellisation_parcours_read';
import {labellisationDemandeReadEndpoint} from 'core-logic/api/endpoints/LabellisationDemandeReadEndpoint';
import {labellisationDemandeWriteEndpoint} from 'core-logic/api/endpoints/LabellisationDemandeWriteEndpoint';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {ReferentielParamOption} from 'app/paths';

/** Renvoie la demande de labellisation de la collectivité courante
 * (et la crée si elle n'existe pas)
 */
export const useDemandeLabellisation = (
  referentiel: ReferentielParamOption,
  etoiles: TEtoiles
): LabellisationDemandeRead | null => {
  const collectivite_id = useCollectiviteId();
  const [data, setData] = useState<LabellisationDemandeRead | null>(null);

  // charge les données
  const fetch = async () => {
    if (collectivite_id) {
      // charge les demandes
      const demandes = await labellisationDemandeReadEndpoint.getBy({
        collectivite_id,
        etoiles,
        referentiel,
      });

      if (demandes.length) {
        setData(demandes[0]);
      }
    }
  };

  // la demande sera rechargée quand elle est mise à jour lors de l'envoi
  useEffect(() => {
    labellisationDemandeWriteEndpoint.addListener(fetch);
    return () => {
      labellisationDemandeWriteEndpoint.removeListener(fetch);
    };
  }, []);

  // charge les données
  useEffect(() => {
    fetch();
  }, [collectivite_id, referentiel, etoiles]);

  return data;
};
