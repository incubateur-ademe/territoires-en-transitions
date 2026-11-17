import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useTelechargementSnbc3 } from './use-telechargement-snbc3';

/**
 * Télécharge « Mes données » : l'outil Excel SNBC 3 ouvert sur le territoire
 * de la collectivité.
 */
export const useTelechargementTrajectoireSnbc3 = () => {
  const { collectiviteId, nom } = useCurrentCollectivite();
  return useTelechargementSnbc3({
    route: '/trajectoires/snbc3/telechargement',
    params: { collectiviteId },
    file: 'donnees-snbc3',
    defaultFileName: `Trajectoire SNBC3 - ${nom}.xlsx`,
  });
};
