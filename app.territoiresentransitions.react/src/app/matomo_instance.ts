import {createInstance} from '@datapunt/matomo-tracker-react';
import {connected, currentUser} from 'core-logic/api/authentication';

const url =
  process.env.REACT_APP_FLAVOR === 'prod'
    ? 'https://stats.data.gouv.fr'
    : 'http://localhost:8888';

export const matomoInstance = createInstance({
  urlBase: url,
  siteId: 180,
  userId: connected() ? currentUser()?.ademe_user_id : undefined,
  trackerUrl: `${url}/piwik.php`,
  srcUrl: `${url}/piwik.js`,
});
