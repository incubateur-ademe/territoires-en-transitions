import { importIndicateurDefinitionSchema } from './import-indicateur-definition.dto';
import { sampleImportIndicateurDefinition } from './samples/import-indicateur-definition.sample';

describe('annual catalog compatibility before importer migration', () => {
  it('defaults an omitted periodicite to annual', () => {
    const { periodicite: _periodicite, ...legacy } =
      sampleImportIndicateurDefinition;
    expect(importIndicateurDefinitionSchema.parse(legacy).periodicite).toBe(
      'annuelle'
    );
  });
  it('rejects monthly definitions until the catalog writer is migrated', () => {
    expect(
      importIndicateurDefinitionSchema.safeParse({
        ...sampleImportIndicateurDefinition,
        periodicite: 'mensuelle',
      }).success
    ).toBe(false);
  });
});
