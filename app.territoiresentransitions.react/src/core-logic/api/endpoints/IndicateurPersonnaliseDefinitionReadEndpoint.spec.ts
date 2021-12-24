import '@testing-library/jest-dom/extend-expect';
import {
  IndicateurPersonnaliseDefinitionGetParams,
  indicateurPersonnaliseDefinitionReadEndpoint,
} from 'core-logic/api/endpoints/IndicateurPersonnaliseDefinitionReadEndpoint';
import {IndicateurPersonnaliseDefinitionRead} from 'generated/dataLayer/indicateur_personnalise_definition_read';

describe('Indicateur perso definition reading endpoint ', () => {
  it('should retrieve data-layer default indicateur perso definition with id 0  for collectivite #1 ', async () => {
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
  it('should retrieve 0 indicateur perso for collectivite #2 ', async () => {
    const results = await indicateurPersonnaliseDefinitionReadEndpoint.getBy({
      collectivite_id: 2,
    });
    expect(results.length).toEqual(0);
  });
});
2;
