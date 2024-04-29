import {useEffect} from 'react';
import {restoreSessionFromAuthTokens} from '@tet/api';
import {supabase} from 'src/clientAPI';

// redirige sur l'url donnée si la session de l'utilisateur peut être restaurée depuis les cookies
export const useRedirectTo = (redirectTo: string) => {
  useEffect(() => {
    const restore = async () => {
      const ret = await restoreSessionFromAuthTokens(supabase);
      if (ret?.data?.session) {
        document.location.replace(redirectTo);
      }
    };
    restore();
  }, [redirectTo]);
};
