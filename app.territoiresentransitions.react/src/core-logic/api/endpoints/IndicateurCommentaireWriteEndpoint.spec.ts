import '@testing-library/jest-dom/extend-expect';
import {IndicateurCommentaireWriteEndpoint} from 'core-logic/api/endpoints/IndicateurCommentaireWriteEndpoint';
import {supabaseClient} from 'core-logic/api/supabase';
import {IndicateurCommentaireWrite} from 'generated/dataLayer/indicateur_commentaire_write';
import {yiliCredentials} from 'test_utils/collectivites';

describe('Indicateur-commentaire write endpoint', () => {
  beforeEach(async () => {
    await supabaseClient.auth.signIn(yiliCredentials);
  });
  const endpoint = new IndicateurCommentaireWriteEndpoint();
  it('Should return an equivalent commentaire when saving a commentaire ', async () => {
    const commentaire: IndicateurCommentaireWrite = {
      collectivite_id: 1,
      indicateur_id: 'cae_10',
      commentaire: 'yolo',
    };
    const actualCommentaireWrite = await endpoint.save(commentaire);
    expect(actualCommentaireWrite).not.toBeNull();
  });

  it('Should fail if user is not connected', async () => {
    await supabaseClient.auth.signOut();
    const commentaire: IndicateurCommentaireWrite = {
      collectivite_id: 1,
      indicateur_id: 'cae_10',
      commentaire: 'yolo',
    };
    const result = await endpoint.save(commentaire);
    expect(result).toEqual(null);
  });
});
