import React from 'react';
import {panierSelect} from '@tet/api/dist/src/panier_action_impact/index';
import {PanierActionImpact} from '@tet/api';
import PanierRealtime from '@components/panier/panier-realtime';
import {notFound} from 'next/navigation';
import {supabase} from 'lib/supabaseServer';

async function Panier({params}: { params: { id: string } }) {
  const panierId = params.id;
  const {data, error} = await supabase.from('panier').
    select(panierSelect).
    eq('id', panierId).single<PanierActionImpact.Panier>();

  if (data) {
    return (
      <div>
        <h1>Panier {panierId}</h1>
        <PanierRealtime panier={data!} />
      </div>
    );
  }
  return notFound();
}

export default Panier;
