import { appLabels } from '@/app/labels/catalog';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { DocumentLine } from './document-line';

const renderLine = ({
  documentTitle,
  isMissing = false,
}: {
  documentTitle: string | null;
  isMissing?: boolean;
}) =>
  render(
    <DocumentLine documentTitle={documentTitle} isMissing={isMissing}>
      {null}
    </DocumentLine>
  );

describe('DocumentLine', () => {
  test('un document disponible porte le glyphe de document, pas de signalement', () => {
    const { container } = renderLine({ documentTitle: 'deliberation.pdf' });

    expect(container.querySelector('.ri-file-text-line')).toBeTruthy();
    expect(screen.queryByText(appLabels.fichierIndisponible)).toBeNull();
  });

  test('un document introuvable remplace ce glyphe par le signalement', () => {
    const { container } = renderLine({
      documentTitle: 'deliberation.pdf',
      isMissing: true,
    });

    expect(container.querySelector('.ri-file-text-line')).toBeNull();
    expect(screen.getByText(appLabels.fichierIndisponible)).toBeTruthy();
  });

  test('le titre tronqué est repris en infobulle native', () => {
    renderLine({ documentTitle: 'deliberation.pdf' });

    expect(screen.getByText('deliberation.pdf').getAttribute('title')).toBe(
      'deliberation.pdf'
    );
  });

  test("un titre absent ne laisse pas d'infobulle vide", () => {
    const { container } = renderLine({ documentTitle: null });

    expect(container.querySelector('span[title]')).toBeNull();
  });
});
