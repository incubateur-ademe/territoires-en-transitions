import {beforeAll, expect, test} from "vitest";
import {signIn, signOut} from "../../tests/auth";
import {testReset} from "../../tests/testReset";
import {supabase} from "../../tests/supabase";
import {selectSousThematiques, selectThematiques} from "./thematique.fetch";

beforeAll(async () => {
    await signIn('yolododo');
    await testReset();

    return async () => {
        await signOut();
    };
});

test('Test selectThematiques', async () => {
    const data = await selectThematiques(supabase);
    expect(data!).not.toBeNull();
    expect(data!).not.toHaveLength(0);
});

test('Test selectSousThematiques', async () => {
    const data = await selectSousThematiques(supabase, null, true);
    expect(data!).not.toBeNull();
    expect(data!).not.toHaveLength(0);
});