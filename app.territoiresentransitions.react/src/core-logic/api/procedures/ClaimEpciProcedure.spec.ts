import {claimEpci} from 'core-logic/api/procedures/ClaimEpciProcedure';
import {supabase} from 'core-logic/api/supabase';

describe('Claim and remove EPCI Remote Procedure Call ', () => {
  const claimedEpciSiren = '240200576';
  it('should return true when user is first to claim this epci', async () => {
    await supabase.auth.signUp({email: 'yili@didi.com', password: 'yolododo'});
    await supabase.auth.signIn({email: 'yili@didi.com', password: 'yolododo'});

    const procedureResponse = await claimEpci(claimedEpciSiren);
    expect(procedureResponse).toBe(true);
  });
  it('should return false when user is not first to claim this epci ', async () => {});
  it('should be able to remove its own rights from an epci ', async () => {});
});
