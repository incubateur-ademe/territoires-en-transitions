import {useEffect, useState} from 'react';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {LabellisationPreuveFichierRead} from 'generated/dataLayer/labellisation_preuve_fichier_read';
import {labellisationFichierReadEndpoint} from 'core-logic/api/endpoints/LabellisationFichierReadEndpoint';
import {labellisationFichierWriteEndpoint} from 'core-logic/api/endpoints/LabellisationFichierWriteEndpoint';

/** Liste les fichiers associés à la demande de labellisation en cours */
export const usePreuves = (
  demande_id: number | undefined
): LabellisationPreuveFichierRead[] => {
  const [preuves, setPreuves] = useState<LabellisationPreuveFichierRead[]>([]);
  const collectivite_id = useCollectiviteId();
  const fetch = () => {
    if (collectivite_id && demande_id) {
      labellisationFichierReadEndpoint
        .getBy({collectivite_id, demande_id})
        .then(setPreuves);
    }
  };

  useEffect(() => {
    labellisationFichierWriteEndpoint.addListener(fetch);
    fetch();
    return () => {
      labellisationFichierWriteEndpoint.removeListener(fetch);
    };
  }, [collectivite_id, demande_id]);

  return preuves;
};
