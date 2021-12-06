import {EpciStorable} from 'storables/EpciStorable';
import {useAllStorables} from 'core-logic/hooks/storables';
import {epciStore} from 'core-logic/api/hybridStores';

/**
 * Returns all the stored Epcis sorted alphabetically.
 */
export const allSortedEpcis = (): EpciStorable[] => {
  const allEpcis = useAllStorables<EpciStorable>(epciStore);
  allEpcis.sort((a, b) => a.nom.localeCompare(b.nom));
  return allEpcis;
};
