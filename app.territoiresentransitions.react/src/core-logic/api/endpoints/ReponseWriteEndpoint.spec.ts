import '@testing-library/jest-dom/extend-expect';
import {ReponseWriteEndpoint} from 'core-logic/api/endpoints/ReponseWriteEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';
import {yoloCredentials, yuluCredentials} from 'test_utils/collectivites';

describe('Reponse writing endpoint', () => {
  it('should return false if user is not allowed to upsert response', async () => {
    const reponseWriteEndpoint = new ReponseWriteEndpoint();
    await supabaseClient.auth.signIn(yuluCredentials); // Yulu has no rights on collectivite #1

    const results = await reponseWriteEndpoint.save({
      collectivite_id: 1,
      question_id: 'dechets_1',
      reponse: true,
    });

    expect(results).toEqual(false);
  });

  it('should return true if user is allowed to upsert response', async () => {
    const reponseWriteEndpoint = new ReponseWriteEndpoint();
    await supabaseClient.auth.signIn(yoloCredentials);

    const results = await reponseWriteEndpoint.save({
      collectivite_id: 1,
      question_id: 'dechets_1',
      reponse: true,
    });

    expect(results).toEqual(true);
  });
});
