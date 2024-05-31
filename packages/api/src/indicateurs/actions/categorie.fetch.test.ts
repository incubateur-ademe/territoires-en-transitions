import {signIn, signOut} from "../../tests/auth";
import {dbAdmin, supabase} from "../../tests/supabase";
import {beforeAll, expect, test} from 'vitest';
import {testReset} from "../../tests/testReset";
import {selectCategories} from "./categorie.fetch";


beforeAll(async () => {
    await signIn('yolododo');
    await testReset();

    return async () => {
        await signOut();
    };
});

test('Test selectCategories', async () => {
    const def = await selectCategories(supabase, 1);
    expect(def!).toHaveLength(8);
});