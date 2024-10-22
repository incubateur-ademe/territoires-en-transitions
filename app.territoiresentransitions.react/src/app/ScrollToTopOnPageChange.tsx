import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export const scrollToTop = () =>
  document.getElementById('app-header')?.scrollIntoView();

export const ScrollToTopOnPageChange = () => {
  const pathname = usePathname();

  useEffect(() => {
    scrollToTop();
  }, [pathname]);

  return null;
};
