import {
  parseDossierInstructionCookie,
  serializeDossierInstructionCookie,
} from './dossier-instruction-cookie';

describe('dossier-instruction-cookie', () => {
  test.each([[{ demandeAvisId: 41 }], [{ demarcheId: 12 }]])(
    'relit le dossier qu’il a écrit : %o',
    (dossier) => {
      expect(
        parseDossierInstructionCookie(
          serializeDossierInstructionCookie(dossier)
        )
      ).toEqual(dossier);
    }
  );

  test.each([
    ['une valeur vide', ''],
    ['un identifiant non numérique', 'abc'],
    ['un identifiant nul', '0'],
    ['une démarche sans identifiant', 'demarche:'],
    ['un préfixe inconnu', 'saisine:41'],
    ['des caractères en trop', '41;x'],
  ])('rend null pour %s', (_, value) => {
    expect(parseDossierInstructionCookie(value)).toBeNull();
  });

  test('rend null sans cookie', () => {
    expect(parseDossierInstructionCookie(undefined)).toBeNull();
    expect(parseDossierInstructionCookie(null)).toBeNull();
  });
});
