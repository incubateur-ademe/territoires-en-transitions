import { beforeEach, expect, test } from 'vitest';
import { signIn, signOut } from '../../../tests/auth';
import { supabase } from '../../../tests/supabase';
import { plansPilotablesFetch } from './plan-actions-pilotable.fetch';

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

test("Indique que la collectivité a deux plans d'actions pilotables", async () => {
  const data = await plansPilotablesFetch(params);

  expect(data).toHaveLength(2);

  data?.forEach((plan) => {
    expect(plan).toHaveProperty('planId');
    expect(plan).toHaveProperty('fiches');
  });
});
