import '@testing-library/jest-dom/extend-expect';
import {ReponseWriteEndpoint} from 'core-logic/api/endpoints/ReponseWriteEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';
import {TQuestionReponseWrite} from 'generated/dataLayer/reponse_write';
import {yoloCredentials, yuluCredentials} from 'test_utils/collectivites';
import {checkReponseProportion} from './ReponseReadEndpoint.spec';

describe('Reponse writing endpoint', () => {
  it('should return false if user is not allowed to upsert response', async () => {
    const reponseWriteEndpoint = new ReponseWriteEndpoint();
    await supabaseClient.auth.signIn(yuluCredentials); // Yulu has no rights on collectivite #1

    const results = await reponseWriteEndpoint.save({
      collectivite_id: 1,
      question: {
        id: 'dechets_1',
        type: 'binaire',
      },
      reponse: true,
    } as TQuestionReponseWrite);

    expect(results).toEqual(false);
  });

  it('should return true if user is allowed to upsert response', async () => {
    const reponseWriteEndpoint = new ReponseWriteEndpoint();
    await supabaseClient.auth.signIn(yoloCredentials);

    const results = await reponseWriteEndpoint.save({
      collectivite_id: 1,
      question: {
        id: 'dechets_1',
        type: 'binaire',
      },
      reponse: true,
    } as TQuestionReponseWrite);

    expect(results).toEqual(true);
  });

  it('should convert proportion value before upsert', async () => {
    const reponseWriteEndpoint = new ReponseWriteEndpoint();
    await supabaseClient.auth.signIn(yoloCredentials);

    // vérifie le test read AVANT l'insertion
    await checkReponseProportion();

    const results = await reponseWriteEndpoint.save({
      collectivite_id: 1,
      question: {
        id: 'habitat_2',
        type: 'proportion',
      },
      reponse: 80,
    } as TQuestionReponseWrite);
    expect(results).toEqual(true);

    // vérifie le test read APRES l'insertion
    await checkReponseProportion();
  });
});
