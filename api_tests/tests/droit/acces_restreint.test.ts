import {
    assertExists,
    assertTrue
} from 'https://deno.land/std/testing/asserts.ts';
import {supabase} from '../../lib/supabase.ts';
import {signIn, signOut} from '../../lib/auth.ts';
import {testReset} from '../../lib/rpcs/testReset.ts';
import {Database} from '../../lib/database.types.ts';

Deno.test('Test accès fiche_action' , async () => {
    await testReset();
    // TODO Enlève yolododo de la collectivité 1 pour le test

    // Test que yolododo a accès aux données de la collectivité 1
    await signIn('yolododo');
    const result1 = await supabase.from('fiche_action').
    select().
    eq('collectivite_id', 1);
    assertExists(result1.data);
    assertTrue(result1.data.length>0);
    await signOut();

    // TODO Passe collectivite 1 en accès restreint

    // Test que yolododo n'a plus accès aux données de la collectivité 1
    await signIn('yolododo');
    const result2 = await supabase.from('fiche_action').
    select().
    eq('collectivite_id', 1);
    assertExists(result2.data);
    assertTrue(result2.data.length=0);
    await signOut();

});

// fiche_action
// axe
// fiche_action_axe
// financeur_tag
// fiche_action_financeur_tag
// service_tag
// fiche_action_service_tag
// partenaire_tag
// fiche_action_partenaire_tag
// personne_tag
// fiche_action_pilote
// fiche_action_referent
// fiche_action_thematique
// fiche_action_sous_thematique
// structure_tag
// fiche_action_structure_tag
// annexe
// fiche_action_annexe
// fiche_action_indicateur
// fiche_action_action
// indicateur_resultat
// indicateur_objectif
// indicateur_commentaire
// indicateur_personnalise_definition
// indicateur_personnalise_resultat
// indicateur_personnalise_objectif
