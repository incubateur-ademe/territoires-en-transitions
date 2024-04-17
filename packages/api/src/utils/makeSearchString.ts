/**
 * Génère une chaîne pour faire une recherche avec l'opérateur `ilike` de
 * postgrest avec plusieurs variantes de la chaîne originale avec ou sans
 * espaces ou tirets entre les mots.
 *
 * @param search chaîne à rechercher
 * @param column nom de la colonne
 * @returns
 */
export const makeSearchString = (search: string, column: string) => {
  if (!search) {
    return;
  }

  const processedSearch = search
    .split(' ')
    .map(w => w.trim())
    .filter(w => w !== '')
    .join(' ');

  const processedSearchWithDash = processedSearch.split(' ').join('-');
  const processedSearchWithDashAndSpace = processedSearch
    .split(' ')
    .join(' - ');
  const processedSearchWithoutDash = processedSearch.split('-').join(' ');

  return [
    `"${column}".ilike.%${processedSearch}%`,
    `"${column}".ilike.%${processedSearchWithDash}%`,
    `"${column}".ilike.%${processedSearchWithDashAndSpace}%`,
    `"${column}".ilike.%${processedSearchWithoutDash}%`,
  ].join(',');
};
