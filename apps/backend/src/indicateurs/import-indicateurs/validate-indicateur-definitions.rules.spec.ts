import { sampleImportIndicateurDefinition } from './samples/import-indicateur-definition.sample';
import { validateIndicateurDefinitions } from './validate-indicateur-definitions.rules';

const validators = {
  indicateurs: {
    extractNeededSourceIndicateursFromFormula: vi.fn(() => []),
    parseExpression: vi.fn(),
  },
  personnalisations: { validateExpression: vi.fn() },
};

describe('PCAET catalog periodicity', () => {
  it('accepts annual definitions used by the diagnostic', () => {
    expect(
      validateIndicateurDefinitions(
        [
          {
            ...sampleImportIndicateurDefinition,
            identifiantReferentiel: 'cae_1.c',
            periodicite: 'annuelle',
          },
        ],
        validators
      )
    ).toEqual({ success: true, data: undefined });
  });

  it('rejects a monthly diagnostic definition before importing it', () => {
    const result = validateIndicateurDefinitions(
      [
        {
          ...sampleImportIndicateurDefinition,
          identifiantReferentiel: 'cae_1.c',
          periodicite: 'mensuelle',
        },
      ],
      validators
    );
    expect(result.success).toBe(false);
    if (result.success)
      throw new Error(
        'Expected the annual diagnostic boundary to reject the definition'
      );
    expect(result.error).toBe('INVALID_IMPORT');
    expect(result.cause?.message).toContain(
      'Le diagnostic PCAET (cae_1.c) exige une périodicité annuelle'
    );
  });

  it('allows monthly definitions outside the annual diagnostic', () => {
    expect(
      validateIndicateurDefinitions(
        [
          {
            ...sampleImportIndicateurDefinition,
            identifiantReferentiel: 'test_mensuel',
            periodicite: 'mensuelle',
          },
        ],
        validators
      )
    ).toEqual({ success: true, data: undefined });
  });
});
