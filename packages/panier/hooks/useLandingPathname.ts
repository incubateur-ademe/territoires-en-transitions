import {useEffect, useState} from 'react';
import {usePathname} from 'next/navigation';
import {useCollectiviteContext, usePanierContext} from 'providers';

const useLandingPathname = () => {
  const [landingPathname, setLandingPathname] = useState('/landing');
  const {collectiviteId} = useCollectiviteContext();
  const {panier} = usePanierContext();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.includes('landing')) {
      setLandingPathname(pathname);
    } else if (collectiviteId) {
      setLandingPathname(`/landing/collectivite/${collectiviteId}`);
    } else if (panier?.id && panier.contenu.length > 0) {
      setLandingPathname(`/landing/panier/${panier.id}`);
    }
  }, [pathname, collectiviteId, panier?.id, panier?.contenu.length]);

  return landingPathname;
};

export default useLandingPathname;
