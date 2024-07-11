import { supabase } from '../../lib/supabase.ts';
import { fakeCredentials, signOut } from '../../lib/auth.ts';
import { testReset } from '../../lib/rpcs/testReset.ts';
import { assertIsBlobWithExpectedSize } from '../../lib/assert.ts';

// TODO à remettre quand l'export des indicateurs sera réactivé
/**
await new Promise((r) => setTimeout(r, 0));

Deno.test('Exporter un indicateur prédéfini', async () => {
  await testReset();

  await supabase.auth.signInWithPassword(fakeCredentials('yolododo'));

  // on demande l'export
  const { data: blob } = await supabase.functions.invoke('export_indicateur', {
    body: {
      collectivite_id: 1,
      indicateur_ids: ['cae_8'],
    },
  });

  // décommenter la ligne suivante pour sauvegarder le fichier localement
  // (pratique pour le dév.)
  // Deno.writeFile('cae_8.xlsx', await blob.arrayBuffer());

  assertIsBlobWithExpectedSize(blob, 7695);

  await signOut();
});

Deno.test('Exporter un indicateur prédéfini composé', async () => {
  await testReset();

  await supabase.auth.signInWithPassword(fakeCredentials('yolododo'));

  // ajoute des données
  const collectivite_id = 1;
  await supabase
    .from('indicateur_resultat')
    .insert([
      ...genValeurs({ collectivite_id, indicateur_id: 'cae_1.a' }, 10, 10),
      ...genValeurs({ collectivite_id, indicateur_id: 'cae_1.b' }, 10, 1),
    ]);
  await supabase
    .from('indicateur_objectif')
    .insert([
      ...genValeurs({ collectivite_id, indicateur_id: 'cae_1.a' }, 10, -10),
      ...genValeurs({ collectivite_id, indicateur_id: 'cae_1.b' }, 10, -1),
    ]);

  // on demande l'export
  const { data: blob } = await supabase.functions.invoke('export_indicateur', {
    body: {
      collectivite_id: 1,
      indicateur_ids: ['cae_1.a'],
    },
  });

  // décommenter la ligne suivante pour sauvegarder le fichier localement
  // (pratique pour le dév.)
  // Deno.writeFile('cae_1.xlsx', await blob.arrayBuffer());

  assertIsBlobWithExpectedSize(blob, 14452);

  await signOut();
});

Deno.test('Exporter un indicateur personnalisé', async () => {
  await testReset();

  await supabase.auth.signInWithPassword(fakeCredentials('yolododo'));

  // on demande l'export
  const { data: blob } = await supabase.functions.invoke('export_indicateur', {
    body: {
      collectivite_id: 1,
      indicateur_ids: [0],
    },
  });

  // décommenter la ligne suivante pour sauvegarder le fichier localement
  // (pratique pour le dév.)
  // Deno.writeFile('perso.xlsx', await blob.arrayBuffer());

  assertIsBlobWithExpectedSize(blob, 7695);

  await signOut();
});

Deno.test('Exporter plusieurs indicateurs', async () => {
  await testReset();

  await supabase.auth.signInWithPassword(fakeCredentials('yolododo'));

  // on demande l'export
  const { data: blob } = await supabase.functions.invoke('export_indicateur', {
    body: {
      collectivite_id: 1,
      indicateur_ids: ['cae_1.a', 'cae_8', 0],
    },
  });

  // décommenter la ligne suivante pour sauvegarder le fichier localement
  // (pratique pour le dév.)
  // Deno.writeFile('indicateurs.zip', await blob.arrayBuffer());

  assertIsBlobWithExpectedSize(blob, 30065);

  await signOut();
});

// générateur de données de tests
const genValeurs = <T>(
  base: { collectivite_id: number; indicateur_id: T },
  count: number,
  increment: number
) => {
  const ret = [];
  for (let i = 0; i < count; i++) {
    ret.push({ ...base, annee: 2000 + i, valeur: 1000 + increment });
  }
  return ret;
};
 */
