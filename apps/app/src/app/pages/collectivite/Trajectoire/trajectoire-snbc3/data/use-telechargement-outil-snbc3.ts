import { useTelechargementSnbc3 } from './use-telechargement-snbc3';

/** Télécharge l'outil Excel SNBC 3, tel qu'il est publié. */
export const useTelechargementOutilSnbc3 = () =>
  useTelechargementSnbc3({
    route: '/trajectoires/snbc3/outil',
    file: 'outil-snbc3',
    defaultFileName: 'Trajectoire SNBC3 - outil.xlsx',
  });
