"use server";

import { supabase } from "lib/supabaseServer";
import { redirect } from "next/navigation";

async function Landing() {
  const { error, data } = await supabase.rpc("panier_from_landing");

  if (data) {
    redirect(`/panier/${data.id}`);
  }

  throw error;
}

export default Landing;
