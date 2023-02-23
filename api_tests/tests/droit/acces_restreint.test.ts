import {
    assertExists,
    assertEquals
} from 'https://deno.land/std/testing/asserts.ts';
import {supabase} from '../../lib/supabase.ts';
import {signIn, signOut} from '../../lib/auth.ts';
import {testReset} from '../../lib/rpcs/testReset.ts';
import {testChangeAccessRestreint} from '../../lib/rpcs/testChangeAccessRestreint.ts';

// fiches_action
Deno.test('Test accès fiches_action' , async () => {
    await testReset();

    // Test que yolododo, qui appartient à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yolododo');
    const result1 = await supabase.from('fiche_action').
    select().
    eq('collectivite_id', 1);
    console.log(result1);
    //assertExists(result1.data);
    //assertEquals(true, result1.data.length>0);
    await signOut();
/*
    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yulududu');
    const result2 = await supabase.from('fiches_action').
    select().
    eq('collectivite_id', 1);
    assertExists(result2.data);
    assertEquals(true, result2.data.length>0);
    await signOut();

    // Passe la collectivite 1 en acces restreint
    await testChangeAccessRestreint(1, true);

    // Test que yolododo, qui appartient à la collectivite 1,
    // a toujours accès aux données de la collectivité 1
    await signIn('yolododo');
    const result3 = await supabase.from('fiches_action').
    select().
    eq('collectivite_id', 1);
    assertExists(result3.data);
    assertEquals(true, result3.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // n'a plus accès aux données de la collectivité 1
    await signIn('yulududu');
    const result4 = await supabase.from('fiches_action').
    select().
    eq('collectivite_id', 1);
    assertExists(result4.data);
    assertEquals(true, result4.data.length==0);
    await signOut();
*/
});
/*
// axe
Deno.test('Test accès axes' , async () => {
    await testReset();

    // Test que yolododo, qui appartient à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yolododo');
    const result1 = await supabase.from('axe').
    select().
    eq('collectivite_id', 1);
    assertExists(result1.data);
    assertEquals(true, result1.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yulududu');
    const result2 = await supabase.from('axe').
    select().
    eq('collectivite_id', 1);
    assertExists(result2.data);
    assertEquals(true, result2.data.length>0);
    await signOut();

    // Passe la collectivite 1 en acces restreint
    await testChangeAccessRestreint(1, true);

    // Test que yolododo, qui appartient à la collectivite 1,
    // a toujours accès aux données de la collectivité 1
    await signIn('yolododo');
    const result3 = await supabase.from('axe').
    select().
    eq('collectivite_id', 1);
    assertExists(result3.data);
    assertEquals(true, result3.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // n'a plus accès aux données de la collectivité 1
    await signIn('yulududu');
    const result4 = await supabase.from('axe').
    select().
    eq('collectivite_id', 1);
    assertExists(result4.data);
    assertEquals(true, result4.data.length==0);
    await signOut();

});

// fiche_action_axe
Deno.test('Test accès fiche_action_axe' , async () => {
    await testReset();

    // Test que yolododo, qui appartient à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yolododo');
    const result1 = await supabase.from('fiche_action_axe').
    select().
    eq('collectivite_id', 1);
    assertExists(result1.data);
    assertEquals(true, result1.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yulududu');
    const result2 = await supabase.from('fiche_action_axe').
    select().
    eq('collectivite_id', 1);
    assertExists(result2.data);
    assertEquals(true, result2.data.length>0);
    await signOut();

    // Passe la collectivite 1 en acces restreint
    await testChangeAccessRestreint(1, true);

    // Test que yolododo, qui appartient à la collectivite 1,
    // a toujours accès aux données de la collectivité 1
    await signIn('yolododo');
    const result3 = await supabase.from('fiche_action_axe').
    select().
    eq('collectivite_id', 1);
    assertExists(result3.data);
    assertEquals(true, result3.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // n'a plus accès aux données de la collectivité 1
    await signIn('yulududu');
    const result4 = await supabase.from('fiche_action_axe').
    select().
    eq('collectivite_id', 1);
    assertExists(result4.data);
    assertEquals(true, result4.data.length==0);
    await signOut();

});

// financeur_tag
Deno.test('Test accès financeur_tag' , async () => {
    await testReset();

    // Test que yolododo, qui appartient à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yolododo');
    const result1 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result1.data);
    assertEquals(true, result1.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yulududu');
    const result2 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result2.data);
    assertEquals(true, result2.data.length>0);
    await signOut();

    // Passe la collectivite 1 en acces restreint
    await testChangeAccessRestreint(1, true);

    // Test que yolododo, qui appartient à la collectivite 1,
    // a toujours accès aux données de la collectivité 1
    await signIn('yolododo');
    const result3 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result3.data);
    assertEquals(true, result3.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // n'a plus accès aux données de la collectivité 1
    await signIn('yulududu');
    const result4 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result4.data);
    assertEquals(true, result4.data.length==0);
    await signOut();

});

// fiche_action_financeur_tag
Deno.test('Test accès financeur_tag' , async () => {
    await testReset();

    // Test que yolododo, qui appartient à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yolododo');
    const result1 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result1.data);
    assertEquals(true, result1.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yulududu');
    const result2 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result2.data);
    assertEquals(true, result2.data.length>0);
    await signOut();

    // Passe la collectivite 1 en acces restreint
    await testChangeAccessRestreint(1, true);

    // Test que yolododo, qui appartient à la collectivite 1,
    // a toujours accès aux données de la collectivité 1
    await signIn('yolododo');
    const result3 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result3.data);
    assertEquals(true, result3.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // n'a plus accès aux données de la collectivité 1
    await signIn('yulududu');
    const result4 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result4.data);
    assertEquals(true, result4.data.length==0);
    await signOut();

});

// service_tag
Deno.test('Test accès financeur_tag' , async () => {
    await testReset();

    // Test que yolododo, qui appartient à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yolododo');
    const result1 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result1.data);
    assertEquals(true, result1.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yulududu');
    const result2 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result2.data);
    assertEquals(true, result2.data.length>0);
    await signOut();

    // Passe la collectivite 1 en acces restreint
    await testChangeAccessRestreint(1, true);

    // Test que yolododo, qui appartient à la collectivite 1,
    // a toujours accès aux données de la collectivité 1
    await signIn('yolododo');
    const result3 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result3.data);
    assertEquals(true, result3.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // n'a plus accès aux données de la collectivité 1
    await signIn('yulududu');
    const result4 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result4.data);
    assertEquals(true, result4.data.length==0);
    await signOut();

});

// fiche_action_service_tag
Deno.test('Test accès financeur_tag' , async () => {
    await testReset();

    // Test que yolododo, qui appartient à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yolododo');
    const result1 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result1.data);
    assertEquals(true, result1.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yulududu');
    const result2 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result2.data);
    assertEquals(true, result2.data.length>0);
    await signOut();

    // Passe la collectivite 1 en acces restreint
    await testChangeAccessRestreint(1, true);

    // Test que yolododo, qui appartient à la collectivite 1,
    // a toujours accès aux données de la collectivité 1
    await signIn('yolododo');
    const result3 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result3.data);
    assertEquals(true, result3.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // n'a plus accès aux données de la collectivité 1
    await signIn('yulududu');
    const result4 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result4.data);
    assertEquals(true, result4.data.length==0);
    await signOut();

});

// partenaire_tag
Deno.test('Test accès financeur_tag' , async () => {
    await testReset();

    // Test que yolododo, qui appartient à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yolododo');
    const result1 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result1.data);
    assertEquals(true, result1.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yulududu');
    const result2 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result2.data);
    assertEquals(true, result2.data.length>0);
    await signOut();

    // Passe la collectivite 1 en acces restreint
    await testChangeAccessRestreint(1, true);

    // Test que yolododo, qui appartient à la collectivite 1,
    // a toujours accès aux données de la collectivité 1
    await signIn('yolododo');
    const result3 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result3.data);
    assertEquals(true, result3.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // n'a plus accès aux données de la collectivité 1
    await signIn('yulududu');
    const result4 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result4.data);
    assertEquals(true, result4.data.length==0);
    await signOut();

});

// fiche_action_partenaire_tag
Deno.test('Test accès financeur_tag' , async () => {
    await testReset();

    // Test que yolododo, qui appartient à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yolododo');
    const result1 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result1.data);
    assertEquals(true, result1.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yulududu');
    const result2 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result2.data);
    assertEquals(true, result2.data.length>0);
    await signOut();

    // Passe la collectivite 1 en acces restreint
    await testChangeAccessRestreint(1, true);

    // Test que yolododo, qui appartient à la collectivite 1,
    // a toujours accès aux données de la collectivité 1
    await signIn('yolododo');
    const result3 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result3.data);
    assertEquals(true, result3.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // n'a plus accès aux données de la collectivité 1
    await signIn('yulududu');
    const result4 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result4.data);
    assertEquals(true, result4.data.length==0);
    await signOut();

});

// personne_tag
Deno.test('Test accès financeur_tag' , async () => {
    await testReset();

    // Test que yolododo, qui appartient à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yolododo');
    const result1 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result1.data);
    assertEquals(true, result1.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yulududu');
    const result2 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result2.data);
    assertEquals(true, result2.data.length>0);
    await signOut();

    // Passe la collectivite 1 en acces restreint
    await testChangeAccessRestreint(1, true);

    // Test que yolododo, qui appartient à la collectivite 1,
    // a toujours accès aux données de la collectivité 1
    await signIn('yolododo');
    const result3 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result3.data);
    assertEquals(true, result3.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // n'a plus accès aux données de la collectivité 1
    await signIn('yulududu');
    const result4 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result4.data);
    assertEquals(true, result4.data.length==0);
    await signOut();

});

// fiche_action_pilote
Deno.test('Test accès financeur_tag' , async () => {
    await testReset();

    // Test que yolododo, qui appartient à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yolododo');
    const result1 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result1.data);
    assertEquals(true, result1.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yulududu');
    const result2 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result2.data);
    assertEquals(true, result2.data.length>0);
    await signOut();

    // Passe la collectivite 1 en acces restreint
    await testChangeAccessRestreint(1, true);

    // Test que yolododo, qui appartient à la collectivite 1,
    // a toujours accès aux données de la collectivité 1
    await signIn('yolododo');
    const result3 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result3.data);
    assertEquals(true, result3.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // n'a plus accès aux données de la collectivité 1
    await signIn('yulududu');
    const result4 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result4.data);
    assertEquals(true, result4.data.length==0);
    await signOut();

});

// fiche_action_referent
Deno.test('Test accès financeur_tag' , async () => {
    await testReset();

    // Test que yolododo, qui appartient à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yolododo');
    const result1 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result1.data);
    assertEquals(true, result1.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yulududu');
    const result2 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result2.data);
    assertEquals(true, result2.data.length>0);
    await signOut();

    // Passe la collectivite 1 en acces restreint
    await testChangeAccessRestreint(1, true);

    // Test que yolododo, qui appartient à la collectivite 1,
    // a toujours accès aux données de la collectivité 1
    await signIn('yolododo');
    const result3 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result3.data);
    assertEquals(true, result3.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // n'a plus accès aux données de la collectivité 1
    await signIn('yulududu');
    const result4 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result4.data);
    assertEquals(true, result4.data.length==0);
    await signOut();

});

// fiche_action_thematique
Deno.test('Test accès financeur_tag' , async () => {
    await testReset();

    // Test que yolododo, qui appartient à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yolododo');
    const result1 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result1.data);
    assertEquals(true, result1.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yulududu');
    const result2 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result2.data);
    assertEquals(true, result2.data.length>0);
    await signOut();

    // Passe la collectivite 1 en acces restreint
    await testChangeAccessRestreint(1, true);

    // Test que yolododo, qui appartient à la collectivite 1,
    // a toujours accès aux données de la collectivité 1
    await signIn('yolododo');
    const result3 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result3.data);
    assertEquals(true, result3.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // n'a plus accès aux données de la collectivité 1
    await signIn('yulududu');
    const result4 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result4.data);
    assertEquals(true, result4.data.length==0);
    await signOut();

});

// fiche_action_sous_thematique
Deno.test('Test accès financeur_tag' , async () => {
    await testReset();

    // Test que yolododo, qui appartient à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yolododo');
    const result1 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result1.data);
    assertEquals(true, result1.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yulududu');
    const result2 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result2.data);
    assertEquals(true, result2.data.length>0);
    await signOut();

    // Passe la collectivite 1 en acces restreint
    await testChangeAccessRestreint(1, true);

    // Test que yolododo, qui appartient à la collectivite 1,
    // a toujours accès aux données de la collectivité 1
    await signIn('yolododo');
    const result3 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result3.data);
    assertEquals(true, result3.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // n'a plus accès aux données de la collectivité 1
    await signIn('yulududu');
    const result4 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result4.data);
    assertEquals(true, result4.data.length==0);
    await signOut();

});

// structure_tag
Deno.test('Test accès financeur_tag' , async () => {
    await testReset();

    // Test que yolododo, qui appartient à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yolododo');
    const result1 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result1.data);
    assertEquals(true, result1.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yulududu');
    const result2 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result2.data);
    assertEquals(true, result2.data.length>0);
    await signOut();

    // Passe la collectivite 1 en acces restreint
    await testChangeAccessRestreint(1, true);

    // Test que yolododo, qui appartient à la collectivite 1,
    // a toujours accès aux données de la collectivité 1
    await signIn('yolododo');
    const result3 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result3.data);
    assertEquals(true, result3.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // n'a plus accès aux données de la collectivité 1
    await signIn('yulududu');
    const result4 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result4.data);
    assertEquals(true, result4.data.length==0);
    await signOut();

});

// fiche_action_structure_tag
Deno.test('Test accès financeur_tag' , async () => {
    await testReset();

    // Test que yolododo, qui appartient à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yolododo');
    const result1 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result1.data);
    assertEquals(true, result1.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yulududu');
    const result2 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result2.data);
    assertEquals(true, result2.data.length>0);
    await signOut();

    // Passe la collectivite 1 en acces restreint
    await testChangeAccessRestreint(1, true);

    // Test que yolododo, qui appartient à la collectivite 1,
    // a toujours accès aux données de la collectivité 1
    await signIn('yolododo');
    const result3 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result3.data);
    assertEquals(true, result3.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // n'a plus accès aux données de la collectivité 1
    await signIn('yulududu');
    const result4 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result4.data);
    assertEquals(true, result4.data.length==0);
    await signOut();

});

// annexe
Deno.test('Test accès financeur_tag' , async () => {
    await testReset();

    // Test que yolododo, qui appartient à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yolododo');
    const result1 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result1.data);
    assertEquals(true, result1.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yulududu');
    const result2 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result2.data);
    assertEquals(true, result2.data.length>0);
    await signOut();

    // Passe la collectivite 1 en acces restreint
    await testChangeAccessRestreint(1, true);

    // Test que yolododo, qui appartient à la collectivite 1,
    // a toujours accès aux données de la collectivité 1
    await signIn('yolododo');
    const result3 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result3.data);
    assertEquals(true, result3.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // n'a plus accès aux données de la collectivité 1
    await signIn('yulududu');
    const result4 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result4.data);
    assertEquals(true, result4.data.length==0);
    await signOut();

});

// fiche_action_annexe
Deno.test('Test accès financeur_tag' , async () => {
    await testReset();

    // Test que yolododo, qui appartient à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yolododo');
    const result1 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result1.data);
    assertEquals(true, result1.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yulududu');
    const result2 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result2.data);
    assertEquals(true, result2.data.length>0);
    await signOut();

    // Passe la collectivite 1 en acces restreint
    await testChangeAccessRestreint(1, true);

    // Test que yolododo, qui appartient à la collectivite 1,
    // a toujours accès aux données de la collectivité 1
    await signIn('yolododo');
    const result3 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result3.data);
    assertEquals(true, result3.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // n'a plus accès aux données de la collectivité 1
    await signIn('yulududu');
    const result4 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result4.data);
    assertEquals(true, result4.data.length==0);
    await signOut();

});

// fiche_action_indicateur
Deno.test('Test accès financeur_tag' , async () => {
    await testReset();

    // Test que yolododo, qui appartient à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yolododo');
    const result1 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result1.data);
    assertEquals(true, result1.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yulududu');
    const result2 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result2.data);
    assertEquals(true, result2.data.length>0);
    await signOut();

    // Passe la collectivite 1 en acces restreint
    await testChangeAccessRestreint(1, true);

    // Test que yolododo, qui appartient à la collectivite 1,
    // a toujours accès aux données de la collectivité 1
    await signIn('yolododo');
    const result3 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result3.data);
    assertEquals(true, result3.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // n'a plus accès aux données de la collectivité 1
    await signIn('yulududu');
    const result4 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result4.data);
    assertEquals(true, result4.data.length==0);
    await signOut();

});

// fiche_action_action
Deno.test('Test accès financeur_tag' , async () => {
    await testReset();

    // Test que yolododo, qui appartient à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yolododo');
    const result1 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result1.data);
    assertEquals(true, result1.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yulududu');
    const result2 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result2.data);
    assertEquals(true, result2.data.length>0);
    await signOut();

    // Passe la collectivite 1 en acces restreint
    await testChangeAccessRestreint(1, true);

    // Test que yolododo, qui appartient à la collectivite 1,
    // a toujours accès aux données de la collectivité 1
    await signIn('yolododo');
    const result3 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result3.data);
    assertEquals(true, result3.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // n'a plus accès aux données de la collectivité 1
    await signIn('yulududu');
    const result4 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result4.data);
    assertEquals(true, result4.data.length==0);
    await signOut();

});

// indicateur_resultat
Deno.test('Test accès financeur_tag' , async () => {
    await testReset();

    // Test que yolododo, qui appartient à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yolododo');
    const result1 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result1.data);
    assertEquals(true, result1.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yulududu');
    const result2 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result2.data);
    assertEquals(true, result2.data.length>0);
    await signOut();

    // Passe la collectivite 1 en acces restreint
    await testChangeAccessRestreint(1, true);

    // Test que yolododo, qui appartient à la collectivite 1,
    // a toujours accès aux données de la collectivité 1
    await signIn('yolododo');
    const result3 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result3.data);
    assertEquals(true, result3.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // n'a plus accès aux données de la collectivité 1
    await signIn('yulududu');
    const result4 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result4.data);
    assertEquals(true, result4.data.length==0);
    await signOut();

});

// indicateur_objectif
Deno.test('Test accès financeur_tag' , async () => {
    await testReset();

    // Test que yolododo, qui appartient à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yolododo');
    const result1 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result1.data);
    assertEquals(true, result1.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yulududu');
    const result2 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result2.data);
    assertEquals(true, result2.data.length>0);
    await signOut();

    // Passe la collectivite 1 en acces restreint
    await testChangeAccessRestreint(1, true);

    // Test que yolododo, qui appartient à la collectivite 1,
    // a toujours accès aux données de la collectivité 1
    await signIn('yolododo');
    const result3 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result3.data);
    assertEquals(true, result3.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // n'a plus accès aux données de la collectivité 1
    await signIn('yulududu');
    const result4 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result4.data);
    assertEquals(true, result4.data.length==0);
    await signOut();

});

// indicateur_commentaire
Deno.test('Test accès financeur_tag' , async () => {
    await testReset();

    // Test que yolododo, qui appartient à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yolododo');
    const result1 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result1.data);
    assertEquals(true, result1.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yulududu');
    const result2 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result2.data);
    assertEquals(true, result2.data.length>0);
    await signOut();

    // Passe la collectivite 1 en acces restreint
    await testChangeAccessRestreint(1, true);

    // Test que yolododo, qui appartient à la collectivite 1,
    // a toujours accès aux données de la collectivité 1
    await signIn('yolododo');
    const result3 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result3.data);
    assertEquals(true, result3.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // n'a plus accès aux données de la collectivité 1
    await signIn('yulududu');
    const result4 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result4.data);
    assertEquals(true, result4.data.length==0);
    await signOut();

});

// indicateur_personnalise_definition
Deno.test('Test accès financeur_tag' , async () => {
    await testReset();

    // Test que yolododo, qui appartient à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yolododo');
    const result1 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result1.data);
    assertEquals(true, result1.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yulududu');
    const result2 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result2.data);
    assertEquals(true, result2.data.length>0);
    await signOut();

    // Passe la collectivite 1 en acces restreint
    await testChangeAccessRestreint(1, true);

    // Test que yolododo, qui appartient à la collectivite 1,
    // a toujours accès aux données de la collectivité 1
    await signIn('yolododo');
    const result3 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result3.data);
    assertEquals(true, result3.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // n'a plus accès aux données de la collectivité 1
    await signIn('yulududu');
    const result4 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result4.data);
    assertEquals(true, result4.data.length==0);
    await signOut();

});

// indicateur_personnalise_resultat
Deno.test('Test accès financeur_tag' , async () => {
    await testReset();

    // Test que yolododo, qui appartient à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yolododo');
    const result1 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result1.data);
    assertEquals(true, result1.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yulududu');
    const result2 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result2.data);
    assertEquals(true, result2.data.length>0);
    await signOut();

    // Passe la collectivite 1 en acces restreint
    await testChangeAccessRestreint(1, true);

    // Test que yolododo, qui appartient à la collectivite 1,
    // a toujours accès aux données de la collectivité 1
    await signIn('yolododo');
    const result3 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result3.data);
    assertEquals(true, result3.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // n'a plus accès aux données de la collectivité 1
    await signIn('yulududu');
    const result4 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result4.data);
    assertEquals(true, result4.data.length==0);
    await signOut();

});

// indicateur_personnalise_objectif
Deno.test('Test accès financeur_tag' , async () => {
    await testReset();

    // Test que yolododo, qui appartient à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yolododo');
    const result1 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result1.data);
    assertEquals(true, result1.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // a accès aux données de la collectivité 1
    await signIn('yulududu');
    const result2 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result2.data);
    assertEquals(true, result2.data.length>0);
    await signOut();

    // Passe la collectivite 1 en acces restreint
    await testChangeAccessRestreint(1, true);

    // Test que yolododo, qui appartient à la collectivite 1,
    // a toujours accès aux données de la collectivité 1
    await signIn('yolododo');
    const result3 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result3.data);
    assertEquals(true, result3.data.length>0);
    await signOut();

    // Test que yulududu, qui n'appartient pas à la collectivite 1,
    // n'a plus accès aux données de la collectivité 1
    await signIn('yulududu');
    const result4 = await supabase.from('financeur_tag').
    select().
    eq('collectivite_id', 1);
    assertExists(result4.data);
    assertEquals(true, result4.data.length==0);
    await signOut();

});*/
