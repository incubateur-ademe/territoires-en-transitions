import { buildCibleLimiteReferences } from './verify-referentiel-expressions.builders';
import { IndicateurReference } from './verify-referentiel-expressions.types';

describe('buildCibleLimiteReferences', () => {
  it('exclut les indicateurs dont l identifiant est absent de indicateurIdParIdentifiant', () => {
    const references: IndicateurReference[] = [
      {
        actionId: 'cae_1.2.3',
        scoreExpression: 'cible(indicateur_inconnu)',
        indicateursExpression: [
          { identifiant: 'indicateur_inconnu', optional: false, tokens: ['cible'] },
        ],
        indicateurs: ['indicateur_inconnu'],
      },
    ];

    const indicateurIdParIdentifiant: Record<string, number> = {};

    const { cible, limite } = buildCibleLimiteReferences(
      references,
      indicateurIdParIdentifiant
    );

    expect(cible).toEqual([]);
    expect(limite).toEqual([]);
  });

  it('conserve les indicateurs dont l identifiant est présent dans indicateurIdParIdentifiant', () => {
    const references: IndicateurReference[] = [
      {
        actionId: 'cae_1.2.3',
        scoreExpression: 'cible(cae_36)',
        indicateursExpression: [
          { identifiant: 'cae_36', optional: false, tokens: ['cible'] },
        ],
        indicateurs: ['cae_36'],
      },
    ];

    const indicateurIdParIdentifiant: Record<string, number> = {
      cae_36: 42,
    };

    const { cible, limite } = buildCibleLimiteReferences(
      references,
      indicateurIdParIdentifiant
    );

    expect(cible).toEqual([
      { indicateurId: 42, actionId: 'cae_1.2.3', scoreExpression: 'cible(cae_36)' },
    ]);
    expect(limite).toEqual([]);
  });
});
