import { supabase } from "../lib/supabase.ts";
import { fakeCredentials, signIn, signOut } from "../lib/auth.ts";
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
  await signIn("yolododo");

  const dcps = await supabase.from("dcp").select();

  // Yolododo ne peut récupérer que ses propres DCP.
  assertEquals(dcps.data!.length, 1);
  assertEquals(dcps.data![0].email, "yolo@dodo.com");

  // on se déconnecte pour libérer les ressources
  await signOut();
});
