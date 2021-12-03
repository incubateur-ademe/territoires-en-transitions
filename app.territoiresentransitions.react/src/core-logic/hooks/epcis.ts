import {useEffect, useState} from 'react';
import {EpciStorable} from 'storables/EpciStorable';
import {useAllStorables} from 'core-logic/hooks/storables';
import {epciStore} from 'core-logic/api/hybridStores';
import {EpciRead} from 'generated/dataLayer/epci_read';
import {allEpciReadEndpoint} from 'core-logic/api/endpoints/EpciReadEndpoints';

/**
 * Returns the list of epcis owned by the current user.
 */
export const currentUserEpcis = (): EpciStorable[] => {
  const [allEpcis, setAllEpcis] = useState<EpciRead[]>([]);
  useEffect(() => {
    allEpciReadEndpoint.getBy({}).then(allEpcis => setAllEpcis(allEpcis));
  }, []);

  // const droits = useDroits();
  // const [epcis, setEpcis] = useState<EpciStorable[]>([]);

  // useEffect(() => {
  // currentUtilisateurDroits().then(droits => {
  // if (droits) {
  // const writable = [];
  // for (const droit of droits) {
  //   if (droit.ecriture) {
  //     for (const epci of allEpcis) {
  //       if (epci.id === droit.epci_id) {
  //         writable.push(epci);
  //         break;
  //       }
  //     }
  //   }
  // }
  // if (!writable.every(s => epcis.includes(s))) setEpcis(writable);
  // }
  // });
  // }, [epcis, allEpcis, droits]);

  return []; //epcis.sort((a, b) => a.nom.localeCompare(b.nom));
};

/**
 * Returns all the stored Epcis sorted alphabetically.
 */
export const allSortedEpcis = (): EpciStorable[] => {
  const allEpcis = useAllStorables<EpciStorable>(epciStore);
  allEpcis.sort((a, b) => a.nom.localeCompare(b.nom));
  return allEpcis;
};
