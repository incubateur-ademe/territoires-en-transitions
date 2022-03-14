import {labellisationReadEndpoint} from 'core-logic/api/endpoints/LabellisationReadEndpoint';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {LabellisationRead} from 'generated/dataLayer/labellisation_read';
import {useEffect, useState} from 'react';

export const useLabellisation = () => {
  const [labellisation, setLabellisation] = useState<LabellisationRead | null>(
    null
  );

  const collectivite_id = useCollectiviteId()!;
  useEffect(() => {
    if (!labellisation) {
      labellisationReadEndpoint
        .getBy({collectivite_id})
        .then(res => setLabellisation(res[0]));
    }
  }, [labellisation]);

  return labellisation;
};
