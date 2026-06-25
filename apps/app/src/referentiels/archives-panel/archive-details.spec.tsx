import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ArchiveDetails } from './archive-details';

const noop = () => undefined;

const baseProps = {
  referentielLabel: 'Climat Air Énergie',
  collectiviteNom: 'Ville Test',
  getElapsedTime: () => 2 * 60 * 1000,
  onDownload: noop,
  onRetry: noop,
};

describe('ArchiveDetails', () => {
  it('affiche référentiel · collectivité et le temps écoulé', () => {
    render(
      <ArchiveDetails
        {...baseProps}
        state={{ kind: 'preparing', processed: 0, total: 0, indeterminate: true }}
      />
    );

    expect(screen.getByText('Climat Air Énergie · Ville Test')).toBeTruthy();
    expect(screen.getByText('il y a 2 minutes')).toBeTruthy();
  });

  it('affiche le ratio de progression en préparation déterminée', () => {
    render(
      <ArchiveDetails
        {...baseProps}
        state={{ kind: 'preparing', processed: 3, total: 10, indeterminate: false }}
      />
    );

    expect(screen.getByText(/3 \/ 10 fichiers/)).toBeTruthy();
  });

  it('masque le ratio en préparation indéterminée', () => {
    render(
      <ArchiveDetails
        {...baseProps}
        state={{ kind: 'preparing', processed: 0, total: 0, indeterminate: true }}
      />
    );

    expect(screen.queryByText(/fichiers/)).toBeNull();
  });

  it('clamp à zéro quand le temps écoulé est négatif (décalage d horloge)', () => {
    render(
      <ArchiveDetails
        {...baseProps}
        getElapsedTime={() => -1000}
        state={{ kind: 'preparing', processed: 0, total: 0, indeterminate: true }}
      />
    );

    expect(screen.getByText(/il y a/)).toBeTruthy();
    expect(screen.queryByText(/dans/)).toBeNull();
  });

  it("affiche le nombre de fichiers et déclenche onDownload depuis l'état prêt", () => {
    const onDownload = vi.fn();
    render(
      <ArchiveDetails
        {...baseProps}
        onDownload={onDownload}
        state={{ kind: 'ready', totalFiles: 12 }}
      />
    );

    expect(screen.getByText(/12 fichiers/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Télécharger/ }));

    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it('affiche le message backend et déclenche onRetry en erreur retryable', () => {
    const onRetry = vi.fn();
    render(
      <ArchiveDetails
        {...baseProps}
        onRetry={onRetry}
        state={{
          kind: 'error',
          backendMessage: 'Le stockage est indisponible.',
          retryable: true,
        }}
      />
    );

    expect(screen.getByText('Le stockage est indisponible.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Réessayer/ }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('utilise le message générique et masque Réessayer en erreur non-retryable', () => {
    render(
      <ArchiveDetails
        {...baseProps}
        state={{ kind: 'error', backendMessage: null, retryable: false }}
      />
    );

    expect(screen.getByText("La génération de l'archive a échoué.")).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Réessayer/ })).toBeNull();
  });
});
