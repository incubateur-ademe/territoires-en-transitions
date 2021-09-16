import {useMatomo} from '@datapunt/matomo-tracker-react';
import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';

/**
 * Basic page view tracker
 */
export function Tracker() {
  const {trackPageView} = useMatomo();
  const location = useLocation();
  useEffect(() => {
    const track = {href: location.pathname};
    if (process.env.REACT_APP_FLAVOR === 'prod') trackPageView(track);
    else console.log('trackPageView', track);
  }, [location]);

  return <></>;
}
