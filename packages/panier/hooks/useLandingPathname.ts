import {useEffect, useState} from 'react';
import {useCollectiviteContext} from 'providers/collectivite';
import {usePanierContext} from 'providers/panier';
import {usePathname} from 'next/navigation';

const useLandingPathname = () => {
  const [landingPathname, setLandingPathname] = useState('/landing');
  const {collectiviteId} = useCollectiviteContext();
  const pathname = usePathname();
  const {panier} = usePanierContext();

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
