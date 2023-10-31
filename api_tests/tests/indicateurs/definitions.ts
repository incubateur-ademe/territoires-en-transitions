import { supabase } from "../../lib/supabase.ts";
import {
  assertExists,
} from "https://deno.land/std@0.196.0/assert/assert_exists.ts";
import { Database } from "../../lib/database.types.ts";
import { signIn, signOut } from "../../lib/auth.ts";
import { testReset } from "../../lib/rpcs/testReset.ts";
import {
  assertEquals,
} from "https://deno.land/std@0.198.0/assert/assert_equals.ts";

await new Promise((r) => setTimeout(r, 0));

type pilotes = Database["public"]["Tables"]["personne_tag"]["Row"];
type thematiques = Database["public"]["Tables"]["thematique"]["Row"];

Deno.test(
  "Définitions des indicateurs et relations calculées.",
  async () => {
    await signIn("yolododo");

    const { data } = await supabase.from("indicateur_definitions")
      // Ajoute les relations pilotes et thématiques
      .select("*, pilotes, thematiques").eq("collectivite_id", 1);
    assertExists(data);
    assertExists(data[0].pilotes as pilotes);
    assertExists(data[0].thematiques as thematiques);

    await signOut();
  },
);

Deno.test(
  "Personne pilotes pour les indicateur prédéfinis.",
  async () => {
    await testReset();
    await signIn("yolododo");

    await supabase.from("indicateur_pilote").upsert({
      collectivite_id: 1,
      indicateur_id: "cae_8",
      user_id: "4ecc7d3a-7484-4a1c-8ac8-930cdacd2561",
    }).select();

    const definitions = await supabase.from("indicateur_definitions")
      // Ajoute la relation pilotes
      .select("*, pilotes")
      .eq("collectivite_id", 1)
      .eq("indicateur_id", "cae_8");
    assertExists(definitions.data);
    const pilotes = definitions.data[0].pilotes as pilotes[];
    assertExists(pilotes);
    assertEquals(pilotes[0]?.nom, "Yala Dada");

    await signOut();
  },
);

Deno.test(
  "Personne pilotes pour les indicateur personnalisés.",
  async () => {
    await testReset();
    await signIn("yolododo");

    const upsert = await supabase.from("indicateur_personnalise_pilote")
      .upsert({
        indicateur_id: 0,
        user_id: "4ecc7d3a-7484-4a1c-8ac8-930cdacd2561",
      })
      .select();
    assertEquals(upsert.status, 201);

    const definitions = await supabase.from("indicateur_definitions")
      .select("*, pilotes")
      .eq("collectivite_id", 1)
      .eq("indicateur_perso_id", 0);
    assertExists(definitions.data);
    const pilotes = definitions.data[0].pilotes as pilotes[];
    assertExists(pilotes);
    assertEquals(pilotes[0]?.nom, "Yala Dada");

    await signOut();
  },
);
