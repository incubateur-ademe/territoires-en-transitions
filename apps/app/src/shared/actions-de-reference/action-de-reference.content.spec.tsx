import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { JSX } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActionDeReferenceContent } from './action-de-reference.content';
import { aireCovoiturageAction } from './actions-de-reference.fixture';

vi.mock('./linked-fiches.card', () => ({
  LinkedFichesCard: ({
    actionDeReferenceId,
  }: {
    actionDeReferenceId: number;
  }): JSX.Element => <p>{`linked-fiches-${actionDeReferenceId}`}</p>,
}));

vi.mock('./action-de-reference.impact', () => ({
  ActionDeReferenceImpactInfo: (): JSX.Element => <p>{'impact-du-levier'}</p>,
}));

afterEach(cleanup);

describe('detail-en-chargement', () => {
  it('montre un indicateur de chargement', () => {
    render(<ActionDeReferenceContent detail={{ status: 'loading' }} />);

    expect(screen.getByRole('status')).toBeDefined();
  });
});

describe('detail-en-erreur', () => {
  it("montre une carte d'erreur", () => {
    render(
      <ActionDeReferenceContent detail={{ status: 'error', retry: vi.fn() }} />
    );

    expect(
      screen.getByRole('heading', { name: 'Une erreur est survenue' })
    ).toBeDefined();
  });

  it('le bouton « Réessayer » relance le chargement', () => {
    const retry = vi.fn();
    render(<ActionDeReferenceContent detail={{ status: 'error', retry }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));

    expect(retry).toHaveBeenCalledTimes(1);
  });
});

describe('detail-introuvable', () => {
  it("dit que l'action de référence n'existe pas", () => {
    render(<ActionDeReferenceContent detail={{ status: 'not-found' }} />);

    expect(
      screen.getByRole('heading', {
        name: "Cette action de référence n'existe pas",
      })
    ).toBeDefined();
  });
});

describe('detail-charge', () => {
  const renderLoadedAction = (): void => {
    render(
      <ActionDeReferenceContent
        detail={{ status: 'loaded', action: aireCovoiturageAction }}
      />
    );
  };

  it("montre la description de l'action", () => {
    renderLoadedAction();

    expect(
      screen.getByText(aireCovoiturageAction.description).textContent
    ).toBe(aireCovoiturageAction.description);
  });

  it("montre le secteur, le levier et la catégorie de l'action une seule fois, sans badge dans l'en-tête", () => {
    renderLoadedAction();

    expect({
      secteur: screen.getAllByText('Transports').length,
      levier: screen.getAllByText('Covoiturage').length,
      categorie: screen.getAllByText('Aménagement & infrastructures').length,
    }).toEqual({ secteur: 1, levier: 1, categorie: 1 });
  });

  it("montre les mises en œuvre de l'action", () => {
    renderLoadedAction();

    expect(
      screen.getByText(`linked-fiches-${aireCovoiturageAction.id}`)
    ).toBeDefined();
  });
});
