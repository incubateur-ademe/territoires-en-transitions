import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

export default function LegacyRouterSync() {
  const history = useHistory();
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    history.push(`${pathname}?${search.toString()}`);
  }, [pathname, history, search]);

  return null;
}
