import { describe, expect, test } from 'vitest';
import { getAuthorAndDate } from './utils';

// La date rendue par les contrats de documents est celle de derniere
// modification : preuve_labellisation, preuve_audit et preuve_rapport
// exposent tous modifiedAt, qu'ils aliasaient en createdAt.
describe('getAuthorAndDate', () => {
  test('annonce une modification, pas un ajout', () => {
    expect(getAuthorAndDate('2026-09-02T10:00:00Z', 'Yolo Dodo')).toBe(
      'Modifié le 2 sept. 2026 par Yolo Dodo'
    );
  });

  test("se passe de l'auteur quand il est inconnu", () => {
    expect(getAuthorAndDate('2026-09-02T10:00:00Z', null)).toBe(
      'Modifié le 2 sept. 2026'
    );
  });

  test('se passe de la date quand elle est inconnue', () => {
    expect(getAuthorAndDate(null, 'Yolo Dodo')).toBe('Modifié par Yolo Dodo');
  });

  test("ne rend rien quand ni la date ni l'auteur ne sont connus", () => {
    expect(getAuthorAndDate(null, null)).toBeNull();
  });
});
