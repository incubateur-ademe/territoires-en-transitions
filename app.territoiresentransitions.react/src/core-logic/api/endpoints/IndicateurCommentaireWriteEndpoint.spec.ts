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
  it('Should be able to create and update a commentaire', async () => {
    const commentaire: IndicateurCommentaireWrite = {
      collectivite_id: 2,
      indicateur_id: 'cae_10',
      commentaire: 'yolo',
    };
    // 1. create
    const createResult = await endpoint.save(commentaire);
    expect(createResult).not.toBeNull();
    expect(createResult).toEqual(expect.objectContaining(commentaire));
    // 2. update
    const updatedCommentaire = {...commentaire, commentaire: 'yolo !! :) '};
    const updateResult = await endpoint.save(updatedCommentaire);
    expect(updateResult).not.toBeNull();
    expect(updateResult).toEqual(expect.objectContaining(updatedCommentaire));
  });

  it('Should fail if collectivite is readonly', async () => {
    const commentaire: IndicateurCommentaireWrite = {
      collectivite_id: 8, // Yili has no right on collectivite #8
      indicateur_id: 'cae_10',
      commentaire: 'yolo',
    };
    const result = await endpoint.save(commentaire);
    expect(endpoint.lastResponse?.status).toBe(403);
    expect(result).toEqual(null);
  });
});
