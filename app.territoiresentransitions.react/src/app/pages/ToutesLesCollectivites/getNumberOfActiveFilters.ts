import {TCollectivitesFilters} from 'app/pages/ToutesLesCollectivites/filtreLibelles';

const notEmpty = (l: string[]): boolean => l.length > 0;

export const getNumberOfActiveFilters = (
  filtres: TCollectivitesFilters
): number => {
  return (
    Number(notEmpty(filtres.regions)) +
    Number(notEmpty(filtres.departments)) +
    Number(notEmpty(filtres.tauxDeRemplissage)) +
    Number(notEmpty(filtres.niveauDeLabellisation)) +
    Number(notEmpty(filtres.population)) +
    Number(notEmpty(filtres.realiseCourant)) +
    Number(notEmpty(filtres.types)) +
    Number(notEmpty(filtres.referentiel)) +
    Number(!!filtres.nom)
  );
};
