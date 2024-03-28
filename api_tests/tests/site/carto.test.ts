import { supabase } from "../../lib/supabase.ts";
import { testReset } from "../../lib/rpcs/testReset.ts";
import { assertExists } from "https://deno.land/std@0.196.0/assert/assert_exists.ts";
import { Database, Json } from "../../lib/database.types.ts";

await new Promise((r) => setTimeout(r, 0));

Deno.test(
  "Contour geojson",
  // ignoré, car le seed par défaut ne charge pas le geojson
  { ignore: true },
  async () => {
    await testReset();

    const { data } = await supabase
      .from("site_labellisation")
      .select("*, geojson")
      .eq("nom", "Agen")
      .returns<Array<{ geojson: unknown }>>();
    assertExists(data);
    assertExists(data[0].geojson);
  }
);
