import { indicateurDefinitionSchemaTiny } from './indicateur-definition.schema';

describe('indicateur definition projections', () => {
  it('requires the observation periodicite', () => {
    const definition = {
      id: 1,
      identifiantReferentiel: 'test_periodicite',
      titre: 'Indicateur mensuel',
      titreLong: null,
      description: null,
      unite: 'kWh',
      periodicite: 'mensuelle',
      borneMin: null,
      borneMax: null,
    };
    expect(indicateurDefinitionSchemaTiny.parse(definition)).toEqual(
      definition
    );
    const { periodicite: _periodicite, ...withoutPeriodicite } = definition;
    expect(
      indicateurDefinitionSchemaTiny.safeParse(withoutPeriodicite).success
    ).toBe(false);
  });
});
