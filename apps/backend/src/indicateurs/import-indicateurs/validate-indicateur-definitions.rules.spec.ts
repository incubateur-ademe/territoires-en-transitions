import { sampleImportIndicateurDefinition } from './samples/import-indicateur-definition.sample';
import { validateIndicateurDefinitions } from './validate-indicateur-definitions.rules';

const validators = {
  indicateurs: {
    extractNeededSourceIndicateursFromFormula: vi.fn(() => []),
    parseExpression: vi.fn(),
  },
  personnalisations: { validateExpression: vi.fn() },
};

describe('catalogue declaration cadence', () => {
  it.each(['annuelle', 'semestrielle', 'trimestrielle', 'mensuelle'] as const)(
    'accepts a %s definition independently of annual diagnostic source observations',
    (periodicite) => {
      expect(
        validateIndicateurDefinitions(
          [
            {
              ...sampleImportIndicateurDefinition,
              identifiantReferentiel: 'cae_1.c',
              periodicite,
            },
          ],
          validators
        )
      ).toEqual({ success: true, data: undefined });
    }
  );
});
