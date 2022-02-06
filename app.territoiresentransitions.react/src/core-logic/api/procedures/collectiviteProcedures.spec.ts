import {
  claimCollectivite,
  referentContact,
} from 'core-logic/api/procedures/collectiviteProcedures';
import {supabaseClient} from 'core-logic/api/supabase';
import {yiliCredentials} from 'test_utils/collectivites';

describe('Claim and remove collectivite Remote Procedure Call ', () => {
  it('should return true when user is first to claim this collectivite', async () => {
    // TODO : test me in the data-layer. The following test CANNOT be run more than once ...
    // await supabaseClient.auth.signIn(yiliCredentials);
    // const procedureResponse = await claimCollectivite(20);
    // expect(procedureResponse).toBe(true);
  });
  it('should return false when user is not first to claim this collectivite ', async () => {});
  it('should be able to remove its own rights from an collectivite ', async () => {});
});

describe('Request referent_contact', () => {
  it('should return referent contact of owned collectivite if exists', async () => {
    const procedureResponse = await referentContact(1);
    expect(procedureResponse).not.toBeNull();
    expect(procedureResponse).toEqual({
      prenom: 'Yolo',
      nom: 'Dodo',
      email: 'yolo@dodo.com',
    });
  });
  it('should return null if no referent yet', async () => {
    const procedureResponse = await referentContact(40);
    expect(procedureResponse).toBeDefined();
    expect(procedureResponse).toBeNull();
  });
});
