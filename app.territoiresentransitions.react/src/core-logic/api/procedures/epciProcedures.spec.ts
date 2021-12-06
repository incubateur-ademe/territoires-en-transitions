import {
  claimEpci,
  referentContact,
} from 'core-logic/api/procedures/epciProcedures';
import {supabase} from 'core-logic/api/supabase';
import {epci1, epci40} from 'test_utils/epci';

describe('Claim and remove EPCI Remote Procedure Call ', () => {
  const claimedEpciSiren = '240100800';
  it('should return true when user is first to claim this epci', async () => {
    await supabase.auth.signIn({email: 'yili@didi.com', password: 'yilididi'});

    const procedureResponse = await claimEpci(claimedEpciSiren);
    expect(procedureResponse).toBe(true);
  });
  it('should return false when user is not first to claim this epci ', async () => {});
  it('should be able to remove its own rights from an epci ', async () => {});
});

describe('Request referent_contact', () => {
  it('should return referent contact of owned epci if exists', async () => {
    const procedureResponse = await referentContact(epci1.siren);
    expect(procedureResponse).toBeDefined();
    expect(procedureResponse).toEqual({
      prenom: 'Yolo',
      nom: 'Dodo',
      email: 'yolo@dodo.com',
    });
  });
  it('should return null if no referent yet', async () => {
    const procedureResponse = await referentContact(epci40.siren);
    expect(procedureResponse).toBeDefined();
    expect(procedureResponse).toBeNull();
  });
});
