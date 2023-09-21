import { supabase } from "../../lib/supabase.ts";
import { testReset } from "../../lib/rpcs/testReset.ts";
import { assertExists } from "https://deno.land/std@0.196.0/assert/assert_exists.ts";
import { assertEquals } from "https://deno.land/std@0.196.0/assert/assert_equals.ts";

await new Promise((r) => setTimeout(r, 0));

Deno.test("Recherche d'une collectivité", async () => {
  await testReset();

  const input = "Toulouse métro";
  const query = `${input}:*`
    .split(" ")
    .map((w) => w.trim())
    .join(" & ");

  const { data, error } = await supabase
    .from("site_labellisation")
    .select()
    .textSearch("nom", query, {
      config: "french",
    });
  assertExists(data);
  assertEquals(data[0].nom, "Toulouse Métropole");
});
