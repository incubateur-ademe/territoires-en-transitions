import { render, screen } from '@testing-library/react';
import { FileItem } from './FileItem';
import { UploadStatusCode } from './types';

const createMockFile = (name: string, size: number): File => {
  const file = new File([''], name, { type: 'application/pdf' });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('FileItem duplicate message', () => {
  test('explains that the already registered name is kept', () => {
    render(
      <FileItem
        file={createMockFile('nouveau nom.pdf', 1024)}
        status={{
          code: UploadStatusCode.duplicated,
          fichier_id: 1,
          filename: 'nom-original.pdf',
          hash: 'hash-1',
        }}
      />
    );

    expect(
      screen.getByText(
        'Ce document existe déjà dans votre bibliothèque. Pour éviter les doublons, il sera ajouté avec le nom déjà enregistré : "nom-original.pdf".'
      )
    ).toBeTruthy();
  });

  test('uses a simpler message when the uploaded name already matches the stored name', () => {
    render(
      <FileItem
        file={createMockFile('nom-original.pdf', 1024)}
        status={{
          code: UploadStatusCode.duplicated,
          fichier_id: 1,
          filename: 'nom-original.pdf',
          hash: 'hash-1',
        }}
      />
    );

    expect(
      screen.getByText(
        'Ce document existe déjà dans votre bibliothèque. Il sera ajouté sans être téléversé à nouveau.'
      )
    ).toBeTruthy();
  });
});