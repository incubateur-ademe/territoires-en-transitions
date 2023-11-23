/**
 * Ajout des filtres département et région
 */
export const addLocalFilters = (
  select: any,
  codeDepartement: string,
  codeRegion: string,
) => {
  if (codeDepartement) {
    return select.eq('code_departement', codeDepartement);
  } else if (codeRegion) {
    return select.eq('code_region', codeRegion);
  } else {
    return select.is('code_region', null).is('code_departement', null);
  }
};
