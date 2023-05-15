import { supabase } from "/lib/supabase.ts";
import { signIn, signOut } from "/lib/auth.ts";
import { testReset } from "/lib/rpcs/testReset.ts";
import { assertExists } from "https://deno.land/std@0.113.0/testing/asserts.ts";

type flatAxe = {
  id: number;
  nom: string;
  fiches: number[];
  ancestors: number[];
  depth: number;
};

type planNode = flatAxe & { children: planNode[] };

/**
 * Convertit une liste d'axes ordonnancée en une liste de plans.
 */
function buildPlans(axes: flatAxe[]): planNode[] {
  let plans: planNode[] = [];
  let nodes = {} as { [key: number]: planNode };

  for (let i = 0; i < axes.length; i++) {
    let axe: planNode = { ...axes[i], children: [] };
    nodes[axe.id] = axe;
    if (axe.depth == 0) plans.push(axe);
    else nodes[axe.ancestors[axe.ancestors.length - 1]].children.push(axe);
  }

  return plans;
}

Deno.test("RPC flat_axes", async () => {
  await testReset();
  await signIn("yolododo");

  const rpcResponse = await supabase.rpc("flat_axes", {
    axe_id: 1,
  });
  assertExists(rpcResponse.data);
  const axes = rpcResponse.data as unknown as flatAxe[];
  const plan = buildPlans(axes);

  console.log(JSON.stringify(plan, null, 2));

  // pour récupérer les fiches on
  // - map sur les axes et leurs `children`
  // - si fiches n'est pas vide, on récupère les fiches :
  //   supabase.from('fiche_resume').select().in('id', axe.fiches);

  await signOut();
});

Deno.test("RPC navigation_plans", async () => {
  await testReset();
  await signIn("yolododo");

  const rpcResponse = await supabase.rpc("navigation_plans", {
    collectivite_id: 1,
  });
  assertExists(rpcResponse.data);
  const axes = rpcResponse.data as unknown as flatAxe[];
  const plans = buildPlans(axes);

  console.log(JSON.stringify(plans, null, 2));

  await signOut();
});
