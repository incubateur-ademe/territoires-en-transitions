import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { signIn, signOut } from '../tests/auth';
import { supabase } from '../tests/supabase';

describe('Test les filtre de la page collectivités engagées', () => {
  beforeEach(async () => {
    // await testReset();
    await signIn('yolododo');
  });

  it('On devrait pouvoir filtrer les plans par département', async () => {
    const { data, error } = await supabase
      .from('axe')
      .select(
        '*, type: plan_action_type, collectivite: collectivite_card!inner(*)'
      )
      .is('parent', null)
      .eq('collectivite.departement_code', '01');

    expect(error).toBeNull();
    expect(data).toEqual(expect.any(Array));
    expect(data).toHaveLength(2);
  });

  afterEach(async () => {
    await signOut();
  });
});
