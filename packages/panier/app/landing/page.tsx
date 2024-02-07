"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "lib/supabaseServer";
import {cookies} from 'next/headers';

async function Landing() {
  const {supabase} = await createServerClient(cookies)
  const { error, data } = await supabase.rpc("panier_from_landing");

  if (data) {
    redirect(`/panier/${data.id}`);
  }

  throw error;
}

export default Landing;
