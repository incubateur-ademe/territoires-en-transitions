import {useEpciId} from 'core-logic/hooks/params';
import {useEffect, useState} from 'react';
import {currentUtilisateurDroits} from 'core-logic/api/authentication';
import {useDroits} from 'core-logic/hooks/authentication';

/**
 * Returns true if the current user have no rights over the current epci.
 */
export function useReadOnly(): boolean {
  const epciId = useEpciId();
  const droits = useDroits();
  const [readOnly, setReadOnly] = useState<boolean>(false);

  useEffect(() => {
    if (epciId) {
      currentUtilisateurDroits().then(utilisateurDroits => {
        const droits = utilisateurDroits!.filter(droits => {
          return droits.ecriture && droits.epci_id === epciId;
        });
        setReadOnly(droits.length === 0);
      });
    } else {
      setReadOnly(false);
    }
  }, [readOnly, epciId, droits]);

  return readOnly;
}
