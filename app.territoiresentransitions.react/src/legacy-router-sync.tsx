import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

export default function LegacyRouterSync() {
  const router = useRouter();
  const history = useHistory();
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    if (pathname !== history.location.pathname) {
      history.replace(`${pathname}?${search.toString()}`);
    }

    const unlisten = history.listen((location, action) => {
      if (action === 'POP' && pathname === location.pathname) {
        router.back();
      }
    });

    // stop the listener when component unmounts
    return unlisten;
  }, [pathname, history, search, router]);

  return null;
}
