import {beforeAll, expect, test} from "vitest";
import {signIn, signOut} from "../../tests/auth";
import {testReset} from "../../tests/testReset";
import {selectCategories} from "../../indicateurs/actions/categorie.fetch";
import {supabase} from "../../tests/supabase";
import {selectPersonnes} from "./personne.fetch";

beforeAll(async () => {
    await signIn('yolododo');
    await testReset();

    return async () => {
        await signOut();
    };
});

test('Test selectPersonnes', async () => {
    const data = await selectPersonnes(supabase, 1);
    expect(data!).not.toHaveLength(0);
});