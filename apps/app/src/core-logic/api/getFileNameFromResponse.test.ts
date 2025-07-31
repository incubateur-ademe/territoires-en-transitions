import {getFileNameFromString} from './getFilenameFromResponse';

describe('getFileNameFromString', () => {
  test("renvoi `undefined` si l'en-tête est vide", () => {
    expect(getFileNameFromString('')).toBeUndefined();
  });

  test("renvoi `undefined` si le nom de fichier n'est pas trouvé", () => {
    expect(getFileNameFromString('attachement')).toBeUndefined();
  });

  test('renvoi le nom sans encodage', () => {
    expect(
      getFileNameFromString(
        'attachement; filename="Trajectoire GES de re?fe?rence-V1.0-20240711.xlsx"'
      )
    ).toBe('Trajectoire GES de re?fe?rence-V1.0-20240711.xlsx');
  });

  test('renvoi le nom décodé', () => {
    expect(
      getFileNameFromString(
        'attachment; filename="Trajectoire GES de re?fe?rence-V1.0-20240711.xlsx"; filename*=UTF-8\'\'Trajectoire%20GES%20de%20re%CC%81fe%CC%81rence-V1.0-20240711.xlsx'
      )
    ).toEqual('Trajectoire GES de référence-V1.0-20240711.xlsx');
  });
});
