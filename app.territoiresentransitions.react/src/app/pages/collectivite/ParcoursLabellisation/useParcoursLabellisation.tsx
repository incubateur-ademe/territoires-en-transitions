import {useEffect, useState} from 'react';
import {LabellisationParcoursRead} from 'generated/dataLayer/labellisation_parcours_read';
import {labellisationParcoursReadEndpoint} from 'core-logic/api/endpoints/LabellisationParcoursReadEndpoint';
import {useCollectiviteId, useReferentielId} from 'core-logic/hooks/params';

/** Renvoie les données de labellisation de la collectivité courante */
export const useParcoursLabellisation =
  (): LabellisationParcoursRead | null => {
    const collectivite_id = useCollectiviteId();
    const referentiel = useReferentielId();
    const [data, setData] = useState<LabellisationParcoursRead[]>([]);

    // charge les données
    const fetch = async () => {
      if (collectivite_id) {
        const parcours = await labellisationParcoursReadEndpoint.getBy({
          collectivite_id,
        });

        setData(parcours);
      }
    };
    useEffect(() => {
      fetch();
    }, [collectivite_id]);

    return data.find(parcours => parcours.referentiel === referentiel) || null;
  };
