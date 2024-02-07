"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "lib/supabaseServer";
import {cookies} from 'next/headers';

async function Landing({ params }: { params: { id: string } }) {
  const {supabase} = await createServerClient(cookies)

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
