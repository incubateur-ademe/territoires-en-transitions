import { useCollectiviteContext, usePanierContext } from '@/panier/providers';
import { usePathname } from 'next/navigation';
import { useEffect, useEffectEvent, useState } from 'react';

const useLandingPathname = () => {
  const [landingPathname, setLandingPathname] = useState('/landing');
  const updateLandingPathname = useEffectEvent((value: string) =>
    setLandingPathname(value)
  );

  const { collectiviteId } = useCollectiviteContext();
  const { panier } = usePanierContext();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.includes('landing')) {
      updateLandingPathname(pathname);
    } else if (collectiviteId) {
      updateLandingPathname(`/landing/collectivite/${collectiviteId}`);
    } else if (panier?.id && panier.selection.length > 0) {
      updateLandingPathname(`/landing/panier/${panier.id}`);
    }
  }, [pathname, collectiviteId, panier?.id, panier?.selection.length]);

  return landingPathname;
};

export default useLandingPathname;
