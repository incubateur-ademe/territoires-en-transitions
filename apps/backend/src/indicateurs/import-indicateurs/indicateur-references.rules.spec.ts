import { describe, expect, it } from 'vitest';
import { IndicateurReferencesRules } from './indicateur-references.rules';
import { importIndicateurReferenceSchema } from './import-indicateur-reference.dto';
import { sampleImportIndicateurDefinition } from './samples/import-indicateur-definition.sample';

describe('Bornes des références externes', () => {
  it.each([
    { valeurMin: 10, valeurMax: 5, valid: false },
    { valeurMin: 5, valeurMax: 5, valid: true },
    { valeurMin: 5, valeurMax: undefined, valid: true },
    { valeurMin: undefined, valeurMax: 5, valid: true },
  ])(
    'vérifie les bornes $valeurMin / $valeurMax avant publication',
    ({ valeurMin, valeurMax, valid }) => {
      const reference = {
        source: 'engagements-electrification',
        codeExterne: 'RENOVATION.parc',
        lienSource: 'https://grist.numerique.gouv.fr/doc-test',
        valeurMin,
        valeurMax,
      };
      expect(importIndicateurReferenceSchema.safeParse(reference).success).toBe(
        valid
      );
      const result = IndicateurReferencesRules.validate(
        [reference],
        [sampleImportIndicateurDefinition]
      );
      expect(result.success).toBe(valid);
      if (!valid)
        expect(result).toMatchObject({
          success: false,
          error: 'INVALID_IMPORT',
        });
    }
  );
});
