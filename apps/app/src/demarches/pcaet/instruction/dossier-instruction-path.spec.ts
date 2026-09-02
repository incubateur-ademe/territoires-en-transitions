import { extractDemandeAvisIdFromPath } from './dossier-instruction-path';

describe('extractDemandeAvisIdFromPath', () => {
  test('rend la saisine portée par un chemin de dossier', () => {
    expect(
      extractDemandeAvisIdFromPath('/collectivite/4147/instruction/41')
    ).toBe(41);
  });

  test('tolère une barre oblique finale', () => {
    expect(
      extractDemandeAvisIdFromPath('/collectivite/4147/instruction/41/')
    ).toBe(41);
  });

  test('ignore la query string et l’ancre', () => {
    expect(
      extractDemandeAvisIdFromPath(
        '/collectivite/4147/instruction/41?etape=documents#haut'
      )
    ).toBe(41);
  });

  test.each([
    ['une autre page de la collectivité', '/collectivite/4147/plans'],
    ['la liste des dossiers du service', '/collectivite/5561/demandes-avis'],
    ['un sous-chemin du dossier', '/collectivite/4147/instruction/41/avis'],
    ['un identifiant non numérique', '/collectivite/4147/instruction/abc'],
    ['un identifiant nul', '/collectivite/4147/instruction/0'],
    ['une collectivité non numérique', '/collectivite/x/instruction/41'],
    ['un chemin hors collectivité', '/profil'],
    ['une chaîne vide', ''],
  ])('rend null pour %s', (_, pathname) => {
    expect(extractDemandeAvisIdFromPath(pathname)).toBeNull();
  });

  test('rend null sans chemin', () => {
    expect(extractDemandeAvisIdFromPath(null)).toBeNull();
    expect(extractDemandeAvisIdFromPath(undefined)).toBeNull();
  });

  test('ne se laisse pas tromper par un préfixe forgé', () => {
    // Le chemin doit commencer par la racine des collectivités : une URL
    // fabriquée autour ne doit pas ouvrir de contexte.
    expect(
      extractDemandeAvisIdFromPath('/x/collectivite/4147/instruction/41')
    ).toBeNull();
  });
});
