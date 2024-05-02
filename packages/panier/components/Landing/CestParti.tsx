'use client';

import {panierAPI} from 'src/clientAPI';
import {useParams, usePathname, useRouter} from 'next/navigation';
import {useEventTracker, Button} from '@tet/ui';

const CestParti = () => {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const pathnameArray = pathname.split('/');
  const id = params['id'];
  const collectivite_id =
    pathnameArray[2] === 'collectivite' && id
      ? parseInt(id as string)
      : undefined;

  const tracker = useEventTracker(
    collectivite_id ? 'panier/landing/collectivite' : 'panier/landing',
  );

  const onClick = async () => {
    const base = await panierAPI.panierFromLanding(collectivite_id);
    collectivite_id
      ? tracker('cta_panier_click', {collectivite_preset: collectivite_id})
      : // @ts-expect-error
        tracker('cta_panier_click');
    router.push(`/panier/${base.id}`);
  };

  return <Button onClick={onClick}>C&apos;est parti !</Button>;
};

export default CestParti;
