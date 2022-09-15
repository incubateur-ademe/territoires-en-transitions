import '@testing-library/jest-dom/extend-expect';
import {indicateurDefinitionReadEndpoint} from 'core-logic/api/endpoints/IndicateurDefinitionReadEndpoint';
import {IndicateurDefinitionRead} from 'generated/dataLayer/indicateur_definition_read';

describe('Indicateur definition reading endpoint', () => {
  it('should retrieve data-layer indicateur definitions of given id', async () => {
    const results = await indicateurDefinitionReadEndpoint.getBy({
      indicateur_id: 'cae_8',
    });

    expect(results).toHaveLength(1);
    const partialExpectedReadIndicateurPersonnaliseDefinition: Partial<IndicateurDefinitionRead> =
      {
        id: 'cae_8',
        // identifiant: '8', // todo fix identifiant in datalayer
        nom: 'Nombre de logements rénovés énergétiquement (nb logements rénovés/100 logements existants)',
        unite: 'nb logements rénovés/100 logements existants',
        obligation_eci: false,
        indicateur_group: 'cae',
      };
    expect(results[0]).toEqual(
      expect.objectContaining(
        partialExpectedReadIndicateurPersonnaliseDefinition
      )
    );
  });
  it('should retrieve data-layer all indicateur definitions given indicateur group', async () => {
    const results = await indicateurDefinitionReadEndpoint.getBy({
      indicateur_group: 'eci',
    });
    expect(results).toHaveLength(35);
  });
});
