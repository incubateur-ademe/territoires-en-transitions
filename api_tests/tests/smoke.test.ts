import { supabase } from "../lib/client.ts";
import { fakeCredentials } from "../lib/auth.ts";
import { assertEquals } from "https://deno.land/std@0.163.0/testing/asserts.ts";

Deno.test("Génération des login/mdp de test", () => {
  assertEquals(
    fakeCredentials("yolododo"),
    { email: "yolo@dodo.com", password: "yolododo" },
  );

  assertEquals(
    fakeCredentials("youloudoudou"),
    { email: "youlou@doudou.com", password: "youloudoudou" },
  );
});

Deno.test("Authentification et DCP", async () => {
  const credentials = fakeCredentials("yolododo");

  const signIn = await supabase.auth.signIn(credentials);
  assertEquals(signIn.data!.user!.email, credentials.email);

  const dcps = await supabase.from("dcp").select();
  assertEquals(dcps.data!.length, 1);
  assertEquals(dcps.data![0].email, credentials.email);

  // on se déconnecte pour libérer les ressources
  await supabase.auth.signOut();
});
