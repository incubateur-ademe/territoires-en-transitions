import { supabase } from '../../lib/supabase.ts';
import { fakeCredentials, signOut } from '../../lib/auth.ts';
import { testReset } from '../../lib/rpcs/testReset.ts';
import { assertIsBlobWithExpectedSize } from '../../lib/assert.ts';

await new Promise((r) => setTimeout(r, 0));

Deno.test('Exporter les scores avant/après audit', async () => {
  await testReset();

  await supabase.auth.signInWithPassword(fakeCredentials('yolododo'));

  // on demande l'export
  const { data: blob } = await supabase.functions.invoke('export_audit_score', {
    body: {
      collectivite_id: 1,
      referentiel: 'eci',
    },
  });

  // décommenter la ligne suivante pour sauvegarder le fichier localement
  // (pratique pour le dév.)
  //Deno.writeFile('tmp.xlsx', await blob.arrayBuffer());

  assertIsBlobWithExpectedSize(blob, 40105);

  await signOut();
});
