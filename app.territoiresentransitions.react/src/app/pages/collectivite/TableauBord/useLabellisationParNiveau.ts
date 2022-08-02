import {labellisationReadEndpoint} from 'core-logic/api/endpoints/LabellisationReadEndpoint';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {LabellisationRead} from 'generated/dataLayer/labellisation_read';
import {useEffect, useState} from 'react';

export const useLabellisationParNiveau = (referentiel: string) => {
  const [labellisation, setLabellisation] =
    useState<LabellisationParNiveauRead | null>(null);

  const collectivite_id = useCollectiviteId()!;
  useEffect(() => {
    labellisationReadEndpoint
      .getBy({collectivite_id, referentiel})
      .then(res => setLabellisation(res.reduce(parNiveau, {})));
  }, [collectivite_id]);

  return labellisation;
};

export type LabellisationParNiveauRead = {
  [key: number]: LabellisationRead;
};

const parNiveau = (
  dict: LabellisationParNiveauRead,
  item: LabellisationRead
) => {
  const {etoiles} = item;
  const index = etoiles || 0; // pour gérer la valeur null
  return dict[index] ? dict : {...dict, [index]: item};
};
