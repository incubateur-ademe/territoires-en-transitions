"use server";

import { supabase } from "lib/supabaseServer";
import { redirect } from "next/navigation";

async function Landing({ params }: { params: { id: string } }) {
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
