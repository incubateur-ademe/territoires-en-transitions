import { ParsedRow } from '../parsers/excel-parser';
import { parseImportedAction } from './import-action.input';

const toParsedRow = (overrides: Partial<ParsedRow>): ParsedRow =>
  ({ ligneExcel: 4, ...overrides } as ParsedRow);

describe('parseImportedAction', () => {
  it("désigne la ligne Excel quand l'action n'a pas de titre", async () => {
    const result = await parseImportedAction(
      toParsedRow({ ligneExcel: 17, status: 'En cours' })
    );

    expect(result).toEqual({
      success: false,
      error: 'Ligne 17 : Colonne titre: Un texte est attendu',
    });
  });

  it("désigne l'action par son titre quand il est renseigné", async () => {
    const result = await parseImportedAction(
      toParsedRow({ titre: 'Former les élus', budget: 'beaucoup' })
    );

    expect(result).toEqual({
      success: false,
      error:
        'Action avec le titre "Former les élus" : Colonne budget: Un nombre est attendu',
    });
  });
});
