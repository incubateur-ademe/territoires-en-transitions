import { beforeEach, expect, test } from 'vitest';
import { supabase } from '../../../tests/supabase';
import { signIn, signOut } from '../../../tests/auth';
import { planActionsPilotableFetch } from './plan-actions-pilotable.fetch';

const params = {
  dbClient: supabase,
  collectiviteId: 1,
};

beforeEach(async () => {
  await signIn('yolododo');

  return async () => {
    await signOut();
  };
});

test("Indique que la collectivité à deux plans d'actions pilotables", async () => {
  const data = await planActionsPilotableFetch(params);

  expect(data).toHaveLength(2);

  expect(data?.[0]).toMatchObject({
    planId: 1,
    fiches: [1, 2, 3, 4, 5, 6],
  });
  expect(data?.[1]).toMatchObject({
    planId: 12,
    fiches: [7, 8, 9, 10, 11, 12],
  });
});
