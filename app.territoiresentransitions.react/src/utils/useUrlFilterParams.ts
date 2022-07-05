import {useEffect, useState} from 'react';
import {useHistory, useLocation} from 'react-router-dom';
import {useQuery as useQueryString} from 'core-logic/hooks/query';

/**
 * Permet d'utiliser un paramètre nommé `filterName` dans l'URL
 *
 * Renvoie la *valeur* du filtre (filter)
 * et la *fonction* pour mettre à jour cette valeur (setFilter).
 */
export const useUrlFilterParams = (
  filterName: string,
  initialFilter = ''
): {filter: string; setFilter: (newFilter: string) => void} => {
  const history = useHistory();
  const location = useLocation();

  const querystring = useQueryString();
  const filterValue = querystring.get(filterName) || initialFilter;

  // L'état interne mis à jour de l'extérieur via setFilter initialisé avec
  // le state de l'URL ou la valeur initiale.
  const [filter, setFilter] = useState(filterValue);

  useEffect(() => {
    // Évite de rafraichir le filtre si une autre partie de l'URL a changée.
    if (filter !== filterValue) {
      querystring.set(filterName, filter);
      // Met à jour l'URL avec React router.
      history.replace({...location, search: `?${querystring}`});
    }
  }, [filter]);

  return {filter, setFilter};
};
