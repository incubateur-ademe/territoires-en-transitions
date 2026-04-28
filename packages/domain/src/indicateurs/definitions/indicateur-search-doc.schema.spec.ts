import { IndicateurSearchDocSchema } from './indicateur-search-doc.schema';

describe('IndicateurSearchDocSchema', () => {
  it('parses a predefined indicateur (collectiviteId: null)', () => {
    const result = IndicateurSearchDocSchema.safeParse({
      id: 10,
      identifiantReferentiel: 'cae_1.a',
      collectiviteId: null,
      groupementId: null,
      titre: 'Émissions GES',
      titreLong: null,
      description: null,
    });
    expect(result.success).toBe(true);
  });

  it('parses a custom indicateur with all optional fields set', () => {
    const result = IndicateurSearchDocSchema.safeParse({
      id: 11,
      identifiantReferentiel: null,
      collectiviteId: 42,
      groupementId: 7,
      titre: 'Consommation eau potable',
      titreLong: "Consommation d'eau potable annuelle",
      description: 'Mesurée en m³ par an.',
    });
    expect(result.success).toBe(true);
  });
});
