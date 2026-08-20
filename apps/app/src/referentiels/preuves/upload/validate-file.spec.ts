import { describe, expect, it } from 'vitest';
import {
  keepWithinMaxFiles,
  MAX_FILE_SIZE_BYTES,
  toFileConstraints,
  toAcceptAttribute,
} from './constants';
import { validateFile } from './validate-file';

/** Contraintes d'un dossier configuré en PDF uniquement (cf. démarche PCAET). */
const PDF_ONLY = toFileConstraints({
  additionalAmont: true,
  additionalAval: true,
  formatsAutorises: ['pdf'],
  mimeTypesAutorises: ['application/pdf'],
});

const fakeFile = (
  name: string,
  { size = 1024, type = '' }: { size?: number; type?: string } = {}
): File => {
  const file = new File(['contenu'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('validateFile', () => {
  it('accepte par défaut tous les formats de la bibliothèque', () => {
    expect(validateFile(fakeFile('rapport.pdf'))).toBeNull();
    expect(validateFile(fakeFile('tableau.xlsx'))).toBeNull();
    expect(validateFile(fakeFile('photo.PNG'))).toBeNull();
  });

  it('refuse un format inconnu et un fichier trop volumineux', () => {
    expect(validateFile(fakeFile('archive.zip'))).toBe('formatError');
    expect(validateFile(fakeFile('sans-extension'))).toBe('formatError');
    expect(
      validateFile(fakeFile('rapport.pdf', { size: MAX_FILE_SIZE_BYTES + 1 }))
    ).toBe('sizeError');
    expect(
      validateFile(fakeFile('archive.zip', { size: MAX_FILE_SIZE_BYTES + 1 }))
    ).toBe('formatAndSizeError');
  });

  it('restreint aux PDF avec les contraintes du dossier PCAET', () => {
    expect(
      validateFile(fakeFile('pcaet.pdf', { type: 'application/pdf' }), PDF_ONLY)
    ).toBeNull();
    expect(validateFile(fakeFile('pcaet.docx'), PDF_ONLY)).toBe('formatError');
    // Extension maquillée : le type déclaré par le navigateur tranche.
    expect(
      validateFile(fakeFile('pcaet.pdf', { type: 'application/zip' }), PDF_ONLY)
    ).toBe('formatError');
    // Type absent (certaines plateformes) : on s'en tient à l'extension.
    expect(validateFile(fakeFile('pcaet.pdf'), PDF_ONLY)).toBeNull();
  });
});

describe('toAcceptAttribute', () => {
  it('construit la valeur de l’attribut accept', () => {
    expect(toAcceptAttribute(PDF_ONLY)).toBe('.pdf');
  });
});

describe('keepWithinMaxFiles', () => {
  it('laisse passer la sélection quand le contexte n’impose pas de limite', () => {
    expect(keepWithinMaxFiles(['a', 'b', 'c'], undefined)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('garde les derniers éléments, ceux qui remplacent les précédents', () => {
    expect(keepWithinMaxFiles(['a', 'b', 'c'], 1)).toEqual(['c']);
    expect(keepWithinMaxFiles(['a', 'b', 'c'], 2)).toEqual(['b', 'c']);
    expect(keepWithinMaxFiles(['a'], 3)).toEqual(['a']);
  });

  it('ne garde rien avec une limite nulle (slice(-0) renverrait tout)', () => {
    expect(keepWithinMaxFiles(['a', 'b', 'c'], 0)).toEqual([]);
  });
});
