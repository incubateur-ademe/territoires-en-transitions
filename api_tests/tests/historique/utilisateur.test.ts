import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { supabase } from "../../lib/supabase.ts";
import { signIn, signOut } from "../../lib/auth.ts";
import { testReset } from "../../lib/rpcs/testReset.ts";

Deno.test(
  "Récupère la liste des utilisateurs ayant fait une modification sur la collectivité",
  async (t) => {
    await testReset();
    await signIn("yolododo");

    const { data } = await supabase.from("historique_utilisateur")
      .select("modified_by_id, modified_by_nom")
      .eq("collectivite_id", 1);

    assertEquals(data, [{
      modified_by_id: null,
      modified_by_nom: "Équipe territoires en transitions",
    }]);

    // on se déconnecte pour libérer les ressources
    await signOut();
  },
);
