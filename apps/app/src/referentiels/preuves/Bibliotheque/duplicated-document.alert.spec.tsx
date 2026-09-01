import { render, screen } from '@testing-library/react';
import { DuplicatedDocumentAlert } from './duplicated-document.alert';

describe('DuplicatedDocumentAlert', () => {
  test('shows the rename-specific duplicate information inside the card', () => {
    render(<DuplicatedDocumentAlert storedFilenameKept={true} />);

    expect(
      screen.getByText(
        'Ce document existait déjà dans votre bibliothèque. Son nom déjà enregistré a été conservé pour éviter les doublons.'
      )
    ).toBeTruthy();
  });

  test('shows a simpler duplicate information when the stored name already matched', () => {
    render(<DuplicatedDocumentAlert storedFilenameKept={false} />);

    expect(
      screen.getByText(
        'Ce document existait déjà dans votre bibliothèque. Il a été ajouté sans être téléversé à nouveau.'
      )
    ).toBeTruthy();
  });
});
