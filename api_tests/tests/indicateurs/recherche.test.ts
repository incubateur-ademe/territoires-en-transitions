import {supabase} from '../../lib/supabase.ts';
import {assertExists} from 'https://deno.land/std@0.206.0/assert/mod.ts';
import {signIn, signOut} from '../../lib/auth.ts';
import {testReset} from '../../lib/rpcs/testReset.ts';

await new Promise((r) => setTimeout(r, 0));

Deno.test(
  'Recherche FTS',
  async () => {
    await testReset();
    await signIn('yolododo');

    const {data} = await supabase
    .from('indicateur_definitions')
      // la cherchable n'apparaitra pas
      .select()
      // on filtre toujours par collectivité
      .eq('collectivite_id', 1)
      // cherche sur le champ dédié à cet effet
      .textSearch('cherchable', `'gaz' & 'serre'`, {
        config: 'fr',
      });

    assertExists(data);
    await signOut();
  },
);
