import {createInstance} from '@datapunt/matomo-tracker-react';
import {authBloc} from 'core-logic/observables';

const url =
  process.env.REACT_APP_FLAVOR === 'prod'
    ? 'https://stats.data.gouv.fr'
    : 'http://localhost:8888';

export const matomoInstance = createInstance({
  urlBase: url,
  siteId: 180,
  userId: authBloc.userId ? authBloc.userId : undefined,
  trackerUrl: `${url}/piwik.php`,
  srcUrl: `${url}/piwik.js`,
});
