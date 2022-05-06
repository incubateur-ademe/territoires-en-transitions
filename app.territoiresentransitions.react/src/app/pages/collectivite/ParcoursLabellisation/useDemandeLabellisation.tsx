import {useEffect, useState} from 'react';
import {LabellisationDemandeRead} from 'generated/dataLayer/labellisation_demande_read';
import {LabellisationParcoursRead} from 'generated/dataLayer/labellisation_parcours_read';
import {labellisationDemandeReadEndpoint} from 'core-logic/api/endpoints/LabellisationDemandeReadEndpoint';
import {labellisationDemandeWriteEndpoint} from 'core-logic/api/endpoints/LabellisationDemandeWriteEndpoint';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {LabellisationDemandeWrite} from 'generated/dataLayer/labellisation_demande_write';

/** Renvoie la demande de labellisation de la collectivité courante
 * (et la crée si elle n'existe pas)
 */
export const useDemandeLabellisation = (
  parcours: LabellisationParcoursRead | null
): LabellisationDemandeRead | null => {
  const collectivite_id = useCollectiviteId();
  const [data, setData] = useState<LabellisationDemandeRead | null>(null);

  // crée la demande
  const create = async (): Promise<LabellisationDemandeWrite | null> => {
    if (collectivite_id && parcours) {
      const {referentiel, etoiles} = parcours;
      return labellisationDemandeWriteEndpoint.save({
        collectivite_id,
        etoiles,
        referentiel,
      });
    }
    return Promise.resolve(null);
  };

  // charge les données
  const fetch = async () => {
    if (collectivite_id && parcours) {
      const {referentiel, etoiles} = parcours;
      // charge les demandes
      const demandes = await labellisationDemandeReadEndpoint.getBy({
        collectivite_id,
        etoiles,
        referentiel,
      });

      if (!demandes?.length) {
        // crée la demande si elle n'existe pas
        const demande = await create();
        if (demande) {
          setData(demande as LabellisationDemandeRead);
        }
      } else {
        setData(demandes[0]);
      }
    }
  };
  useEffect(() => {
    fetch();
  }, [collectivite_id, parcours]);

  return data;
};
