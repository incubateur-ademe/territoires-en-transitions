import {useLocation} from 'react-router-dom';
import {useEffect} from 'react';

export const scrollToTop = () =>
  document.getElementsByClassName('fr-header').item(0)?.scrollIntoView();

export const ScrollToTopOnPageChange = () => {
  const {pathname} = useLocation();

  useEffect(() => {
    scrollToTop();
  }, [pathname]);

  return null;
};
