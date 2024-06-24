import {getAppBaseUrl, restoreSessionFromAuthTokens} from '@tet/api';
import {dcpFetch} from '@tet/api/dist/src/utilisateurs/shared/data_access/dcp.fetch';
import {RedirectType, redirect, useRouter} from 'next/navigation';
import {useEffect} from 'react';
import {supabase} from 'src/clientAPI';

// redirige sur l'url donnée si la session de l'utilisateur peut être restaurée depuis les cookies
export const useRedirectTo = (redirectTo: string) => {
  const router = useRouter();

  useEffect(() => {
    const restore = async () => {
      const sessionData = await restoreSessionFromAuthTokens(supabase);
      const user = sessionData?.data.user;

      if (!user) {
        return;
      }

      const dcpData = await dcpFetch({
        dbClient: supabase,
        user_id: user.id,
      });

      if (user && !dcpData) {
        const searchParams = new URLSearchParams({redirect_to: redirectTo});
        router.replace(`/signup?view=etape3&${searchParams}`);
        return;
      }

      if (redirectTo.startsWith('/')) {
        const url = getAppBaseUrl(window.location.hostname) + redirectTo;
        router.replace(url);
        return;
      }

      if (nestPasUneUrlAuth(redirectTo)) {
        router.replace(redirectTo);
        return;
      }
    };
    restore();
  }, [redirectTo, router]);
};

function nestPasUneUrlAuth(url: string) {
  const authOrigin = window.document.location.origin;
  return !url.startsWith(authOrigin);
}
