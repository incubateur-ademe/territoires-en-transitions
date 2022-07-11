import {ReactNode, useMemo} from 'react';
import {createInstance, MatomoProvider} from '@datapunt/matomo-tracker-react';
import {useAuth} from 'core-logic/api/auth/AuthProvider';

const url =
  process.env.REACT_APP_FLAVOR === 'prod'
    ? 'https://stats.data.gouv.fr'
    : 'http://localhost:8888';

export const MatomoProviderWithAuth = ({children}: {children: ReactNode}) => {
  const {user} = useAuth();
  const matomoInstance = useMemo(
    () =>
      createInstance({
        urlBase: url,
        siteId: 180,
        userId: user ? user.id : undefined,
        trackerUrl: `${url}/piwik.php`,
        srcUrl: `${url}/piwik.js`,
      }),
    [user]
  );

  return <MatomoProvider value={matomoInstance}>{children}</MatomoProvider>;
};
