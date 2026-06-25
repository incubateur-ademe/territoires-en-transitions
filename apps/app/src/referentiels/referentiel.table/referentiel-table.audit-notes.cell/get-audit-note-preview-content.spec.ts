import { describe, expect, it } from 'vitest';
import { getAuditNotePreviewContent } from './get-audit-note-preview-content';

describe('getAuditNotePreviewContent', () => {
  it('retourne une chaine vide quand la note est absente', () => {
    expect(getAuditNotePreviewContent('')).toBe('');
    expect(getAuditNotePreviewContent(null)).toBe('');
    expect(getAuditNotePreviewContent(undefined)).toBe('');
  });

  it('retire les balises HTML', () => {
    expect(getAuditNotePreviewContent('<p>Bonjour</p>')).toBe('Bonjour');
  });

  it('retourne une chaine vide quand le HTML ne contient aucun texte', () => {
    expect(getAuditNotePreviewContent('<p></p>')).toBe('');
    expect(getAuditNotePreviewContent('<ul><li></li></ul>')).toBe('');
  });

  it('ne garde que le premier paragraphe', () => {
    expect(
      getAuditNotePreviewContent('<p>Premiere ligne</p><p>Deuxieme ligne</p>')
    ).toBe('Premiere ligne');
  });

  it('ne garde que le premier element d une liste', () => {
    expect(
      getAuditNotePreviewContent(
        '<ul><li>Un</li><li>Deux</li><li>Trois</li></ul>'
      )
    ).toBe('Un');
  });

  it('utilise le titre comme premiere ligne avant une liste', () => {
    expect(
      getAuditNotePreviewContent('<h1>Titre</h1><ul><li>Un</li><li>Deux</li></ul>')
    ).toBe('Titre');
  });

  it('coupe sur un saut de ligne <br>', () => {
    expect(getAuditNotePreviewContent('<p>Avant<br>Apres</p>')).toBe('Avant');
  });

  it('ignore les premieres lignes vides', () => {
    expect(getAuditNotePreviewContent('<p></p><p>Contenu</p>')).toBe('Contenu');
  });

  it('normalise les espaces multiples', () => {
    expect(getAuditNotePreviewContent('<p>Trop    d   espaces</p>')).toBe(
      'Trop d espaces'
    );
  });

  it('preserve les accents francais', () => {
    expect(getAuditNotePreviewContent('<p>Evalue a debote</p>')).toBe(
      'Evalue a debote'
    );
    expect(getAuditNotePreviewContent('<p>Évalué à débôté</p>')).toBe(
      'Évalué à débôté'
    );
  });
});
