"use server";

import {cookies} from 'next/headers';
import {createClient} from 'src/supabase/server';
import {redirect} from 'next/navigation';


async function Landing({ params }: { params: { id: string } }) {
  const supabase = createClient(cookies())

  const collectivite_id = parseInt(params.id);
  const { error, data } = await supabase.rpc("panier_from_landing", {
    collectivite_id,
  });
  if (data) {
    redirect(`/panier/${data.id}`);
  }

  throw error;
}

export default Landing;
