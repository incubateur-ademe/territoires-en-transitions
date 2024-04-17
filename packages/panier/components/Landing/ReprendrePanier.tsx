'use client';

import {useParams, usePathname, useRouter} from 'next/navigation';
import {useEventTracker, Button} from '@tet/ui';
import {useCollectiviteContext} from 'providers';

const ReprendrePanier = () => {
  const {collectiviteId} = useCollectiviteContext();
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const pathnameArray = pathname.split('/');
  const id = params['id'];
  const panier_id =
    pathnameArray[2] === 'panier' && id ? (id as string) : undefined;

  const tracker = useEventTracker('panier/landing');

  const handleClick = async () => {
    if (!!panier_id) {
      // @ts-expect-error
      tracker('cta_panier_click');
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
