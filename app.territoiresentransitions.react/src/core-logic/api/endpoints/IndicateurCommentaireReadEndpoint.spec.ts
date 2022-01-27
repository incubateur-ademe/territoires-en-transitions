import '@testing-library/jest-dom/extend-expect';
import {indicateurCommentaireReadEndpoint} from 'core-logic/api/endpoints/IndicateurCommentaireReadEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';
import {yiliCredentials} from 'test_utils/collectivites';

describe('Indicateur-commentaire reading endpoint ', () => {
  beforeEach(async () => {
    await supabaseClient.auth.signIn(yiliCredentials);
  });

  it('should retrieve data-layer default commentaire for collectivite #1 ', async () => {
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
  it('should retrieve 0 commentaire for collectivite #2 ', async () => {
    const results = await indicateurCommentaireReadEndpoint.getBy({
      collectivite_id: 2,
    });
    expect(results.length).toEqual(0);
  });
});
2;
