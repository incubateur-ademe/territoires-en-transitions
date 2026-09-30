import { describe, expect, test } from 'vitest';
import { getAuthorAndDate, getDocumentTitle } from './document-label.utils';
import {
  preuveReglementaireFichier,
  preuveReglementaireLien,
} from './documents.fixture';

describe('getDocumentTitle', () => {
  test("rend le nom nu du fichier quand aucune option n'est demandée", () => {
    expect(getDocumentTitle(preuveReglementaireFichier)).toBe(
      'preuve_input.txt'
    );
  });

  test("ajoute l'extension en majuscules quand elle est demandée", () => {
    expect(
      getDocumentTitle(preuveReglementaireFichier, { withExtension: true })
    ).toBe('preuve_input.txt (TXT)');
  });

  test('ajoute la taille seule quand seule la taille est demandée', () => {
    expect(
      getDocumentTitle(preuveReglementaireFichier, { withFilesize: true })
    ).toBe('preuve_input.txt (34 o)');
  });

  test("place l'extension avant la taille quand les deux sont demandées", () => {
    expect(
      getDocumentTitle(preuveReglementaireFichier, {
        withExtension: true,
        withFilesize: true,
      })
    ).toBe('preuve_input.txt (TXT, 34 o)');
  });

  test('rend le titre du lien, que les options du fichier soient demandées ou non', () => {
    expect(getDocumentTitle(preuveReglementaireLien)).toBe('dodo');
    expect(
      getDocumentTitle(preuveReglementaireLien, {
        withExtension: true,
        withFilesize: true,
      })
    ).toBe('dodo');
  });

  test("rend le nom conservé d'un fichier introuvable, sans extension ni taille", () => {
    expect(
      getDocumentTitle(
        { type: 'fichierManquant', filename: 'perdu.pdf' },
        { withExtension: true, withFilesize: true }
      )
    ).toBe('perdu.pdf');
  });

  test("ne rend rien quand le document n'est pas renseigné", () => {
    expect(getDocumentTitle({ type: 'nonRenseigne' })).toBeNull();
  });
});

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
