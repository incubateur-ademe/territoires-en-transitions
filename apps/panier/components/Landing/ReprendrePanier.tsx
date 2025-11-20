'use client';

import { useCollectiviteContext } from '@/panier/providers';
import { Button, Event, useEventTracker } from '@tet/ui';
import { useParams, usePathname, useRouter } from 'next/navigation';

const ReprendrePanier = () => {
  const { collectiviteId } = useCollectiviteContext();
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const pathnameArray = pathname.split('/');
  const id = params['id'];
  const panier_id =
    pathnameArray[2] === 'panier' && id ? (id as string) : undefined;

  const tracker = useEventTracker();

  const handleClick = async () => {
    if (panier_id) {
      tracker(Event.panier.ctaPanierClick, {
        panierId: panier_id,
      });
      router.push(`/panier/${panier_id}`);
    }
  };

  return !collectiviteId && !!panier_id ? (
    <Button onClick={handleClick} variant="outlined">
      Reprendre mon panier en cours
    </Button>
  ) : null;
};

export default ReprendrePanier;
