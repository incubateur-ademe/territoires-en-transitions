import '@testing-library/jest-dom/extend-expect';
import {QuestionThematiqueReadEndpoint} from 'core-logic/api/endpoints/QuestionThematiqueReadEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';
import {yuluCredentials} from 'test_utils/collectivites';

describe('Question completude by thematique reading endpoint', () => {
  it('should retrieve thematique by thematique_id', async () => {
    const questionThematiqueReadEndpoint = new QuestionThematiqueReadEndpoint(
      []
    );
    await supabaseClient.auth.signInWithPassword(yuluCredentials); // Yulu has no rights on collectivite #1

    const results = await questionThematiqueReadEndpoint.getBy({
      thematique_id: 'dechets',
    });

    expect(results.length).toEqual(1);

    expect(results).toEqual([
      {
        id: 'dechets',
        nom: 'Déchets',
      },
    ]);
  });

  it('should returns an empty array if thematique_id was not found', async () => {
    const questionThematiqueReadEndpoint = new QuestionThematiqueReadEndpoint(
      []
    );
    await supabaseClient.auth.signInWithPassword(yuluCredentials); // Yulu has no rights on collectivite #1

    const results = await questionThematiqueReadEndpoint.getBy({
      thematique_id: 'nimp',
    });

    expect(results.length).toEqual(0);
  });
});
