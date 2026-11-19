import {
  clearAllDossierInstructionCookies,
  clearDossierInstructionCookiesExcept,
  parseDossierInstructionCookie,
  serializeDossierInstructionCookie,
  writeDossierInstructionCookie,
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

describe('effacement des dossiers mémorisés', () => {
  const cookieNames = () =>
    document.cookie
      .split(';')
      .map((cookie) => cookie.split('=')[0].trim())
      .filter(Boolean)
      .sort();

  beforeEach(() => {
    clearAllDossierInstructionCookies();
    document.cookie = 'autre_cookie=1; path=/';
    writeDossierInstructionCookie(4147, '41');
    writeDossierInstructionCookie(5556, 'demarche:12');
  });

  test('garde celui de la collectivité où l’on navigue', () => {
    clearDossierInstructionCookiesExcept(4147);

    expect(cookieNames()).toEqual([
      'autre_cookie',
      'tet_dossier_instruction_4147',
    ]);
  });

  test('les efface tous hors de toute collectivité', () => {
    clearDossierInstructionCookiesExcept(null);

    expect(cookieNames()).toEqual(['autre_cookie']);
  });
});
