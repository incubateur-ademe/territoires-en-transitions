import '@testing-library/jest-dom/extend-expect';
import {QuestionThematiqueCompletudeReadEndpoint} from 'core-logic/api/endpoints/QuestionThematiqueCompletudeReadEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';
import {yuluCredentials} from 'test_utils/collectivites';

describe('Question completude by thematique reading endpoint ', () => {
  it('should retrieve items by collectivite_id', async () => {
    const questionThematiqueReadEndpoint =
      new QuestionThematiqueCompletudeReadEndpoint([]);
    await supabaseClient.auth.signIn(yuluCredentials); // Yulu has no rights on collectivite #1

    const results = await questionThematiqueReadEndpoint.getBy({
      collectivite_id: 1,
    });

    expect(results).toEqual(
      expect.arrayContaining([
        {
          collectivite_id: 1,
          id: 'dechets',
          nom: 'Déchets',
          referentiels: ['eci', 'cae'],
          completude: 'a_completer',
        },
        {
          collectivite_id: 1,
          completude: 'a_completer',
          id: 'eau_assainissement',
          nom: 'Eau et assainissement',
          referentiels: ['cae'],
        },
      ])
    );
  });
});
