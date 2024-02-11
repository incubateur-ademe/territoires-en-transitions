"use server";

import {cookies} from 'next/headers';
import {createClient} from 'src/supabase/server';
import {redirect} from 'next/navigation';

async function Landing() {
  const supabase = createClient(cookies())
  const { error, data } = await supabase.rpc("panier_from_landing");

  if (data) {
    redirect(`/panier/${data.id}`);
  }

  throw error;
}

export default Landing;
