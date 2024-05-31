import {beforeAll, expect, test} from "vitest";
import {signIn, signOut} from "../../tests/auth";
import {testReset} from "../../tests/testReset";
import {dbAdmin, supabase} from "../../tests/supabase";
import {deleteIndicateur, deleteIndicateurValeur} from "./indicateur.delete";
import {selectIndicateurDefinition, selectIndicateurValeur} from "./indicateur.fetch";

beforeAll(async () => {
    await signIn('yolododo');
    await testReset();

    return async () => {
        await signOut();
    };
});

test('Test deleteIndicateur', async () => {
    // Supprimer indicateur personnalisé
    await deleteIndicateur(supabase, 123, 1);
    const def = await selectIndicateurDefinition(supabase, 123, 1);
    expect(def).toBeNull;

    // Supprimer indicateur prédéfini (pas possible)
    await deleteIndicateur(supabase, 1, 1);
    const def2 = await selectIndicateurDefinition(supabase, 1, 1);
    expect(def2).not.toBeNull;
});

test('Test deleteIndicateurValeur', async () => {
    const v = await dbAdmin.from('indicateur_valeur').insert({
        indicateur_id : 1, collectivite_id : 10, metadonnee_id : null, date_valeur : '2020-01-01', resultat : 1
    }).select('id');
    // Supprime valeur collectivité
    await deleteIndicateurValeur(supabase, 1);
    const val  = await selectIndicateurValeur(supabase, 1);
    expect(val).toBeNull;
    // Supprime valeur aure collectivité (pas possible)
    await deleteIndicateurValeur(supabase, v.data![0].id);
    const val2  = await selectIndicateurValeur(supabase, v.data![0].id);
    expect(val2).not.toBeNull;
});