'use client';

import {panierAPI} from 'src/clientAPI';
import {useParams, useRouter} from 'next/navigation';

export default function CestParti() {
  const params = useParams();
  const router = useRouter();
  const id = params['id'];
  const collectivite_id = id ? parseInt(id as string) : undefined;
  const onClick = async () => {
    const base = await panierAPI.panierFromLanding(collectivite_id);
    router.push(`/panier/${base.id}`);
  };

  return <button onClick={onClick}>C&apos;est parti !</button>;
}
