import { describe, expect, it } from 'vitest';
import {
  MAX_FILE_SIZE_BYTES,
  PDF_ONLY_FILE_CONSTRAINTS,
  toAcceptAttribute,
} from './constants';
import { validateFile } from './validate-file';

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
      validateFile(
        fakeFile('pcaet.pdf', { type: 'application/pdf' }),
        PDF_ONLY_FILE_CONSTRAINTS
      )
    ).toBeNull();
    expect(validateFile(fakeFile('pcaet.docx'), PDF_ONLY_FILE_CONSTRAINTS)).toBe(
      'formatError'
    );
    // Extension maquillée : le type déclaré par le navigateur tranche.
    expect(
      validateFile(
        fakeFile('pcaet.pdf', { type: 'application/zip' }),
        PDF_ONLY_FILE_CONSTRAINTS
      )
    ).toBe('formatError');
    // Type absent (certaines plateformes) : on s'en tient à l'extension.
    expect(
      validateFile(fakeFile('pcaet.pdf'), PDF_ONLY_FILE_CONSTRAINTS)
    ).toBeNull();
  });
});

describe('toAcceptAttribute', () => {
  it('construit la valeur de l’attribut accept', () => {
    expect(toAcceptAttribute(PDF_ONLY_FILE_CONSTRAINTS)).toBe('.pdf');
  });
});
