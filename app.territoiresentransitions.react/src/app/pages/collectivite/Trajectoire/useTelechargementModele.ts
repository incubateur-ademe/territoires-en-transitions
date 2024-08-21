import {useMutation} from 'react-query';
import {useApiClient} from 'core-logic/api/useApiClient';
import {saveBlob} from 'ui/shared/preuves/Bibliotheque/saveBlob';

/** Télécharge le fichier xlsx modèle */
export const useTelechargementModele = () => {
  const api = useApiClient();

  return useMutation('snbc/modele', async () => {
    const {blob, filename} = await api.getAsBlob({
      route: '/trajectoires/snbc/modele',
    });
    if (blob) {
      await saveBlob(blob, filename || `Trajectoire SNBC - modèle.xlsx`);
    }
  });
};
