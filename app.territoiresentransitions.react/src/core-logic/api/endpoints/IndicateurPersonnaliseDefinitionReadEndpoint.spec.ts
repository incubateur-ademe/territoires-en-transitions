import '@testing-library/jest-dom/extend-expect';
import {indicateurPersonnaliseDefinitionReadEndpoint} from 'core-logic/api/endpoints/IndicateurPersonnaliseDefinitionReadEndpoint';
import {IndicateurPersonnaliseDefinitionRead} from 'generated/dataLayer/indicateur_personnalise_definition_read';
import {supabaseClient} from 'core-logic/api/supabase';
import {yuluCredentials} from 'test_utils/collectivites';

describe('Indicateur perso definition reading endpoint', () => {
  it('should not be able to read if not connected', async () => {
    const results = await indicateurPersonnaliseDefinitionReadEndpoint.getBy({
      collectivite_id: 1,
    });

    expect(results).toHaveLength(0);
  });
  it('should retrieve data-layer default indicateur perso definition with id 0 for collectivite #1 (for anyone connected)', async () => {
    await supabaseClient.auth.signInWithPassword(yuluCredentials); // Yulu has no rights on collectivite #1

    const results = await indicateurPersonnaliseDefinitionReadEndpoint.getBy({
      collectivite_id: 1,
      indicateur_id: 0,
    });

    expect(results).toHaveLength(1);
    const partialExpectedReadIndicateurPersonnaliseDefinition: Partial<IndicateurPersonnaliseDefinitionRead> =
      {
        id: 0,
        collectivite_id: 1,
        titre: 'Mon indicateur perso',
        description: 'Description',
        unite: 'm2/hab',
        commentaire: 'Mon commentaire',
      };
    expect(results[0]).toEqual(
      expect.objectContaining(
        partialExpectedReadIndicateurPersonnaliseDefinition
      )
    );
  });
});
