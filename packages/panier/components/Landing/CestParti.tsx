'use client';

import {panierAPI} from 'src/clientAPI';
import {useParams, useRouter} from 'next/navigation';
import {useEventTracker} from 'src/tracking/useEventTracker';

export default function CestParti() {
  const params = useParams();
  const router = useRouter();
  const id = params['id'];
  const collectivite_id = id ? parseInt(id as string) : undefined;
  const tracker = useEventTracker(
    collectivite_id ? 'landing/collectivite' : 'landing'
  );
  const onClick = async () => {
    const base = await panierAPI.panierFromLanding(collectivite_id);
    // @ts-ignore
    tracker('cta_panier', {});
    router.push(`/panier/${base.id}`);
  };

  return <button onClick={onClick}>C&apos;est parti !</button>;
}
