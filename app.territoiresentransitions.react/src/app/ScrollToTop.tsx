import {useHistory, useLocation} from 'react-router-dom';
import {useEffect} from 'react';

export const ScrollToTop = () => {
  const {pathname} = useLocation();
  const history = useHistory();

  useEffect(() => {
    if (history.action === 'PUSH') window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};
