import {useMutation} from 'react-query';
import {useApiClient} from 'core-logic/api/useApiClient';
import {saveBlob} from 'ui/shared/preuves/Bibliotheque/saveBlob';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {DOWNLOAD_FILE_MUTATION_OPTIONS} from 'utils/useDownloadFile';

/** Télécharge le fichier xlsx de la trajectoire */
export const useTelechargementTrajectoire = () => {
  const collectivite = useCurrentCollectivite();
  const api = useApiClient();

  return useMutation(
    'snbc/telechargement',
    async () => {
      if (!collectivite) return;

      const {blob, filename} = await api.getAsBlob({
        route: '/trajectoires/snbc/telechargement',
        params: {collectivite_id: collectivite.collectivite_id},
      });
      if (blob) {
        await saveBlob(
          blob,
          filename || `Trajectoire SNBC - ${collectivite.nom}.xlsx`
        );
      }
    },
    DOWNLOAD_FILE_MUTATION_OPTIONS
  );
};
