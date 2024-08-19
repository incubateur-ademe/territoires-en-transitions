import {useMutation} from 'react-query';
import {useApiClient} from 'core-logic/api/useApiClient';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {saveBlob} from 'ui/shared/preuves/Bibliotheque/saveBlob';

/** Télécharge le fichier xlsx de la trajectoire */
export const useTelechargementTrajectoire = () => {
  const collectiviteId = useCollectiviteId();
  const api = useApiClient();

  return useMutation('snbc/telechargement', async () => {
    if (!collectiviteId) return;

    const {blob, filename} = await api.getAsBlob({
      route: '/trajectoires/snbc/telechargement',
      params: {collectivite_id: collectiviteId},
    });
    if (blob && filename) {
      await saveBlob(blob, filename);
    }
  });
};
