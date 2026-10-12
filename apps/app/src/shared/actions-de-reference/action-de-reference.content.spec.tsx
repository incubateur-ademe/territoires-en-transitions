import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { JSX } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActionDeReferenceContent } from './action-de-reference.content';
import { aireCovoiturageAction } from './actions-de-reference.fixture';

vi.mock('./mises-en-oeuvre.card', () => ({
  MisesEnOeuvreCard: ({
    actionDeReferenceId,
  }: {
    actionDeReferenceId: number;
  }): JSX.Element => <p>{`mises-en-oeuvre-${actionDeReferenceId}`}</p>,
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

  it("montre le levier et la catégorie de l'action en badge et en champ", () => {
    renderLoadedAction();

    expect({
      levier: screen.getAllByText('Covoiturage').length,
      categorie: screen.getAllByText('Aménagement & infrastructures').length,
    }).toEqual({ levier: 2, categorie: 2 });
  });

  it("indique que c'est une action de référence de l'ADEME", () => {
    renderLoadedAction();

    expect(screen.getByText('Action de référence ADEME')).toBeDefined();
  });

  it("montre les mises en œuvre de l'action", () => {
    renderLoadedAction();

    expect(
      screen.getByText(`mises-en-oeuvre-${aireCovoiturageAction.id}`)
    ).toBeDefined();
  });
});
