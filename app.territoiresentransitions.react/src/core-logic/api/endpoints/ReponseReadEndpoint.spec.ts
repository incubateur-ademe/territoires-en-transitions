import '@testing-library/jest-dom/extend-expect';
import {ReponseReadEndpoint} from 'core-logic/api/endpoints/ReponseReadEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';
import {yoloCredentials, yuluCredentials} from 'test_utils/collectivites';

export const checkReponseProportion = async () => {
  const reponseReadEndpoint = new ReponseReadEndpoint([]);
  await supabaseClient.auth.signInWithPassword(yoloCredentials);

  const results = await reponseReadEndpoint.getBy({
    collectivite_id: 1,
    question_id: 'habitat_2',
  });

  expect(results.length).toEqual(1);
  expect(results).toMatchObject([
    {
      question_id: 'habitat_2',
      collectivite_id: 1,
      reponse: {
        question_id: 'habitat_2',
        collectivite_id: 1,
        type: 'proportion',
        reponse: 80,
      },
    },
  ]);
};

describe('Reponse reading endpoint', () => {
  it('should return an empty array if there is no response for a question', async () => {
    const reponseReadEndpoint = new ReponseReadEndpoint([]);
    await supabaseClient.auth.signInWithPassword(yuluCredentials); // Yulu has no rights on collectivite #1

    const results = await reponseReadEndpoint.getBy({
      collectivite_id: 1,
      question_id: 'dechets_1',
    });

    expect(results.length).toEqual(0);
  });

  it('should return an empty array if user is not bind to the collectivite', async () => {
    const reponseReadEndpoint = new ReponseReadEndpoint([]);
    await supabaseClient.auth.signInWithPassword(yuluCredentials); // Yulu has no rights on collectivite #1

    const results = await reponseReadEndpoint.getBy({
      collectivite_id: 1,
      question_id: 'mobilite_1',
    });

    expect(results.length).toEqual(0);
  });

  it('should return the response to a question (binaire)', async () => {
    const reponseReadEndpoint = new ReponseReadEndpoint([]);
    await supabaseClient.auth.signInWithPassword(yoloCredentials);

    const results = await reponseReadEndpoint.getBy({
      collectivite_id: 1,
      question_id: 'dechets_1',
    });

    expect(results.length).toEqual(1);
    expect(results).toMatchObject([
      {
        question_id: 'dechets_1',
        collectivite_id: 1,
        reponse: {
          question_id: 'dechets_1',
          collectivite_id: 1,
          type: 'binaire',
          reponse: true,
        },
      },
    ]);
  });

  it(
    'should return the response to a question (proportion)',
    checkReponseProportion
  );
});
