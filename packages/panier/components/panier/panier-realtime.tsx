'use client';

import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {PanierActionImpact} from '@tet/api';
import {supabase} from 'lib/supabaseClient';

export default function PanierRealtime({panier}: {
  panier: PanierActionImpact.Panier
}) {
  const router = useRouter();

  useEffect(() => {
    const channel = supabase.channel('realtime todos').on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'panier',
        filter: `id=eq.${panier.id}`,
      },
      (payload) => {
        console.log(payload)
        router.refresh();
      },
    ).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router, panier.id]);

  return (
    <pre>{JSON.stringify(panier, null, 2)}</pre>
  );
}
