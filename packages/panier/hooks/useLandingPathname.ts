import { useCollectiviteContext, usePanierContext } from '@/panier/providers';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const useLandingPathname = () => {
  const [landingPathname, setLandingPathname] = useState('/landing');
  const { collectiviteId } = useCollectiviteContext();
  const { panier } = usePanierContext();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.includes('landing')) {
      setLandingPathname(pathname);
    } else if (collectiviteId) {
      setLandingPathname(`/landing/collectivite/${collectiviteId}`);
    } else if (panier?.id && panier.selection.length > 0) {
      setLandingPathname(`/landing/panier/${panier.id}`);
    }
  }, [pathname, collectiviteId, panier?.id, panier?.selection.length]);

  return landingPathname;
};

export default useLandingPathname;
