import {useMutation} from 'react-query';
import {useEventTracker} from '@tet/ui';
import {useApiClient} from 'core-logic/api/useApiClient';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {saveBlob} from 'ui/shared/preuves/Bibliotheque/saveBlob';
import {DOWNLOAD_FILE_MUTATION_OPTIONS} from 'utils/useDownloadFile';

/** Télécharge le fichier xlsx modèle */
export const useTelechargementModele = () => {
  const api = useApiClient();
  const trackEvent = useEventTracker('app/trajectoires/snbc');
  const collectivite_id = useCollectiviteId()!;

  return useMutation(
    'snbc/modele',
    async () => {
      trackEvent('cta_download', {collectivite_id, file: 'modele'});
      const {blob, filename} = await api.getAsBlob({
        route: '/trajectoires/snbc/modele',
      });
      if (blob) {
        await saveBlob(blob, filename || `Trajectoire SNBC - modèle.xlsx`);
      }
    },
    DOWNLOAD_FILE_MUTATION_OPTIONS
  );
};
