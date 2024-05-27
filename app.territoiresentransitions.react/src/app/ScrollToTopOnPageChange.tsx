import {useLocation} from 'react-router-dom';
import {useEffect} from 'react';

export const scrollToTop = () =>
  document.getElementById('app-header')?.scrollIntoView();

export const ScrollToTopOnPageChange = () => {
  const {pathname} = useLocation();

  useEffect(() => {
    scrollToTop();
  }, [pathname]);

  return null;
};
