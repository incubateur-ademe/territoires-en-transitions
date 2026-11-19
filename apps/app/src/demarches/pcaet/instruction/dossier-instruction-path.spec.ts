import {
  extractCollectiviteIdFromPath,
  extractDossierInstructionRefFromPath,
} from './dossier-instruction-path';

describe('extractDossierInstructionRefFromPath', () => {
  test('rend la saisine portée par un chemin de dossier', () => {
    expect(
      extractDossierInstructionRefFromPath('/collectivite/4147/instruction/41')
    ).toEqual({ demandeAvisId: 41 });
  });

  test('rend la démarche portée par le chemin d’un dépôt en élaboration', () => {
    expect(
      extractDossierInstructionRefFromPath(
        '/collectivite/4147/instruction/demarche/12'
      )
    ).toEqual({ demarcheId: 12 });
  });

  test('tolère une barre oblique finale', () => {
    expect(
      extractDossierInstructionRefFromPath('/collectivite/4147/instruction/41/')
    ).toEqual({ demandeAvisId: 41 });
  });

  test('ignore la query string et l’ancre', () => {
    expect(
      extractDossierInstructionRefFromPath(
        '/collectivite/4147/instruction/41?etape=documents#haut'
      )
    ).toEqual({ demandeAvisId: 41 });
  });

  test.each([
    ['une autre page de la collectivité', '/collectivite/4147/plans'],
    ['la liste des dossiers du service', '/collectivite/5561/demandes-avis'],
    ['un sous-chemin du dossier', '/collectivite/4147/instruction/41/avis'],
    ['un identifiant non numérique', '/collectivite/4147/instruction/abc'],
    ['un identifiant nul', '/collectivite/4147/instruction/0'],
    [
      'une démarche sans identifiant',
      '/collectivite/4147/instruction/demarche',
    ],
    ['une collectivité non numérique', '/collectivite/x/instruction/41'],
    ['un chemin hors collectivité', '/profil'],
    ['une chaîne vide', ''],
  ])('rend null pour %s', (_, pathname) => {
    expect(extractDossierInstructionRefFromPath(pathname)).toBeNull();
  });

  test('rend null sans chemin', () => {
    expect(extractDossierInstructionRefFromPath(null)).toBeNull();
    expect(extractDossierInstructionRefFromPath(undefined)).toBeNull();
  });
});

describe('extractCollectiviteIdFromPath', () => {
  test.each([
    ['la racine de la collectivité', '/collectivite/4147', 4147],
    ['une page de la collectivité', '/collectivite/4147/plans', 4147],
    ['un dossier', '/collectivite/4147/instruction/41', 4147],
    ['une query string', '/collectivite/4147?onglet=1', 4147],
  ])('rend la collectivité pour %s', (_, pathname, expected) => {
    expect(extractCollectiviteIdFromPath(pathname)).toBe(expected);
  });

  test.each([
    ['le raccourci du tableau de bord', '/collectivite/tableau-de-bord'],
    ['un identifiant suivi de lettres', '/collectivite/4147abc/plans'],
    ['un identifiant nul', '/collectivite/0/plans'],
    ['un chemin hors collectivité', '/profil'],
    ['une chaîne vide', ''],
    ['pas de chemin', null],
  ])('rend null pour %s', (_, pathname) => {
    expect(extractCollectiviteIdFromPath(pathname)).toBeNull();
  });
});
