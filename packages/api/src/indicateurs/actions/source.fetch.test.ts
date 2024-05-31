import {beforeAll, expect, test} from "vitest";
import {signIn, signOut} from "../../tests/auth";
import {testReset} from "../../tests/testReset";
import {selectThematiques} from "../../shared/actions/thematique.fetch";
import {dbAdmin, supabase} from "../../tests/supabase";
import {selectSources} from "./source.fetch";

beforeAll(async () => {
    await signIn('yolododo');
    await testReset();

    return async () => {
        await signOut();
    };
});

test('Test selectSources', async () => {
    const data = await selectSources(supabase);
    expect(data!).not.toBeNull();
    expect(data!).toHaveLength(4);
});