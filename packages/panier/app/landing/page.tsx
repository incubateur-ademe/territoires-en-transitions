import { supabase } from "@tet/api/dist/src/tests/supabase";
import { redirect } from "next/navigation";

async function Landing() {
  const { error, data } = await supabase.rpc("panier_from_landing");

  if (data) {
    redirect(`/panier/${data.id}`);
  }

  throw error;
}

export default Landing;
