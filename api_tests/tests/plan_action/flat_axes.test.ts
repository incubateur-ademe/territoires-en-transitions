import { assertExists } from 'https://deno.land/std@0.113.0/testing/asserts.ts';
import { signIn, signOut } from '../../lib/auth.ts';
import { testReset } from '../../lib/rpcs/testReset.ts';
import { supabase } from '../../lib/supabase.ts';

await new Promise((r) => setTimeout(r, 0));

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

Deno.test('RPC navigation_plans', async () => {
  await testReset();
  await signIn('yolododo');

  const rpcResponse = await supabase.rpc('navigation_plans', {
    collectivite_id: 1,
  });
  assertExists(rpcResponse.data);
  const axes = rpcResponse.data as unknown as flatAxe[];
  const plans = buildPlans(axes);

  await signOut();
});
