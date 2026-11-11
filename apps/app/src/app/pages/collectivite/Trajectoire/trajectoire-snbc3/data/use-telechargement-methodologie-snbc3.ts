import { useTelechargementSnbc3 } from './use-telechargement-snbc3';

/**
 * Télécharge le PDF de méthodologie de la release SNBC 3 importée : le même
 * millésime que la trajectoire affichée (stocké par l'import du lot 1).
 */
export const useTelechargementMethodologieSnbc3 = () =>
  useTelechargementSnbc3({
    route: '/trajectoires/snbc3/methodologie',
    file: 'methodo-snbc3',
    defaultFileName: 'Méthodologie trajectoire SNBC3.pdf',
  });
