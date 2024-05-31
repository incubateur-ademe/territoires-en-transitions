import {beforeAll, expect, test} from "vitest";
import {signIn, signOut} from "../../tests/auth";
import {testReset} from "../../tests/testReset";
import {selectCategories} from "../../indicateurs/actions/categorie.fetch";
import {supabase} from "../../tests/supabase";
import {insertTags} from "./tag.save";
import {Tag} from "../domain/tag.schema";

beforeAll(async () => {
    await signIn('yolododo');
    await testReset();

    return async () => {
        await signOut();
    };
});

test('Test insertTags', async () => {
    const toInsert : Tag[] = [{
        nom : 'test',
        collectiviteId: 1
    },
        {
        nom : 'test2',
        collectiviteId: 1
    }];
    const def = await insertTags(supabase, 'categorie', toInsert);
    expect(def!).toHaveLength(2);
});