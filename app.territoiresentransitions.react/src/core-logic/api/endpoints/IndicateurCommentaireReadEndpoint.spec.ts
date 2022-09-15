import '@testing-library/jest-dom/extend-expect';
import {indicateurCommentaireReadEndpoint} from 'core-logic/api/endpoints/IndicateurCommentaireReadEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';
import {yuluCredentials} from 'test_utils/collectivites';

describe('Indicateur-commentaire reading endpoint', () => {
  it('should not be able to read if not connected', async () => {
    const results = await indicateurCommentaireReadEndpoint.getBy({
      collectivite_id: 1,
    });

    expect(results).toHaveLength(0);
  });
  it('should retrieve data-layer default commentaire for collectivite #1 (for any connected user)', async () => {
    await supabaseClient.auth.signIn(yuluCredentials); // Yulu has not rights on collectivite #1
    const results = await indicateurCommentaireReadEndpoint.getBy({
      collectivite_id: 1,
      indicateur_id: 'cae_8',
    });

    expect(results).toHaveLength(1);
    const partialExpectedReadCommentaire = {
      collectivite_id: 1,
      commentaire: 'un commentaire sur cae_8',
      indicateur_id: 'cae_8',
    };
    expect(results[0]).toEqual(
      expect.objectContaining(partialExpectedReadCommentaire)
    );
  });
});
