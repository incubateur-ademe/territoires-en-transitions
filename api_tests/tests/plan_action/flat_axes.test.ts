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
 * Convertit une liste d'axes en arbre.
 */
function buildPlan(axes: flatAxe[]): planNode {
  let plan = { ...axes[0]!, children: [] };
  let nodes = {} as { [key: number]: planNode };
  nodes[plan.id] = plan;

  if (axes.length > 1) {
    for (let i = 1; i < axes.length; i++) {
      let axe: planNode = { ...axes[i], children: [] };
      nodes[axe.id] = axe;
      nodes[axe.ancestors[axe.ancestors.length - 1]].children.push(axe);
    }
  }
  return plan;
}

Deno.test("RPC flat_axes", async () => {
  await testReset();
  await signIn("yolododo");

  const rpcResponse = await supabase.rpc("flat_axes", {
    plan_id: 1,
  });
  assertExists(rpcResponse.data);
  const axes = rpcResponse.data as unknown as flatAxe[];
  const plan = buildPlan(axes);

  console.log(JSON.stringify(plan, null, 2));

  // pour récupérer les fiches on
  // - map sur les axes et leurs `children`
  // - si fiches n'est pas vide, on récupère les fiches :
  //   supabase.from('fiche_resume').select().in('id', axe.fiches);

  await signOut();
});
