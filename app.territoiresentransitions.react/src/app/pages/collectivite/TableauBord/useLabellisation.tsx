import {labellisationReadEndpoint} from 'core-logic/api/endpoints/LabellisationReadEndpoint';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {LabellisationRead} from 'generated/dataLayer/labellisation_read';
import {useEffect, useState} from 'react';

export const useLabellisation = (referentiel: string) => {
  const [labellisation, setLabellisation] =
    useState<LabellisationReadByEtoiles | null>(null);

  const collectivite_id = useCollectiviteId()!;
  useEffect(() => {
    if (!labellisation) {
      labellisationReadEndpoint
        .getBy({collectivite_id, referentiel})
        .then(res => setLabellisation(res.reduce(byEtoiles, {})));
    }
  }, [labellisation]);

  return labellisation;
};

export type LabellisationReadByEtoiles = {
  [key: number]: LabellisationRead;
};

const byEtoiles = (
  dict: LabellisationReadByEtoiles,
  item: LabellisationRead
) => {
  const {etoiles} = item;
  const index = etoiles || 0; // pour gérer la valeur null
  return dict[index] ? dict : {...dict, [index]: item};
};
