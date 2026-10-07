import { appLabels } from '@/app/labels/catalog';
import {
  toDocumentHash,
  toFichier,
  toFichierManquant,
  toLien,
} from '@tet/domain/collectivites';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { DocumentTitle } from './document-title';

const documentFichier = toFichier({
  fichier: {
    id: 21,
    collectiviteId: 1,
    hash: toDocumentHash(
      'c9df071601f3f72b5430a55cd7ea584be5c2a36bb4226b621c4dca50088ef8b9'
    ),
    filename: 'rapport.pdf',
    filesize: 34,
    bucketId: '9d4ccd86-268b-4292-aeda-18bfbe6496df',
    confidentiel: false,
  },
});

const documentLien = toLien({
  lien: { url: 'https://exemple.test/rapport', titre: 'Rapport en ligne' },
});

const documentIntrouvable = toFichierManquant({ filename: 'perdu.pdf' });

describe('DocumentTitle', () => {
  test('rend le nom du fichier dans un bouton', () => {
    render(<DocumentTitle document={documentFichier} onOpen={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'rapport.pdf' })).toBeTruthy();
  });

  test('rend le titre du lien, pas son url', () => {
    render(<DocumentTitle document={documentLien} onOpen={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: 'Rapport en ligne' })
    ).toBeTruthy();
  });

  test("le nom d'un fichier introuvable n'est pas un bouton", () => {
    render(<DocumentTitle document={documentIntrouvable} onOpen={vi.fn()} />);

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('perdu.pdf')).toBeTruthy();
  });

  test('un clic sur le titre demande son ouverture', () => {
    const onOpen = vi.fn();
    render(<DocumentTitle document={documentFichier} onOpen={onOpen} />);

    fireEvent.click(screen.getByRole('button', { name: 'rapport.pdf' }));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  test('un titre désactivé ne demande pas son ouverture au clic', () => {
    const onOpen = vi.fn();
    render(
      <DocumentTitle document={documentFichier} onOpen={onOpen} disabled />
    );

    fireEvent.click(screen.getByRole('button', { name: 'rapport.pdf' }));

    expect(onOpen).not.toHaveBeenCalled();
  });

  test('un fichier annonce son téléchargement au survol du titre', async () => {
    render(<DocumentTitle document={documentFichier} onOpen={vi.fn()} />);

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'rapport.pdf' }));

    expect((await screen.findByRole('tooltip')).textContent).toBe(
      appLabels.telechargerFichier
    );
  });

  test('un lien annonce son ouverture au survol du titre', async () => {
    render(<DocumentTitle document={documentLien} onOpen={vi.fn()} />);

    fireEvent.mouseEnter(
      screen.getByRole('button', { name: 'Rapport en ligne' })
    );

    expect((await screen.findByRole('tooltip')).textContent).toBe(
      appLabels.ouvrirLien
    );
  });

  test("l'extension et la taille ne s'affichent que si elles sont demandées", () => {
    render(
      <DocumentTitle
        document={documentFichier}
        onOpen={vi.fn()}
        withExtension
        withFilesize
      />
    );

    expect(
      screen.getByRole('button', { name: 'rapport.pdf (PDF, 34 o)' })
    ).toBeTruthy();
  });
});
