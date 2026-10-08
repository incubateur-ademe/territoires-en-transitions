import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActionDeReferenceContent } from './action-de-reference.content';
import { aireCovoiturageAction } from './actions-de-reference.fixture';

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
  it("montre la description, le levier et la catégorie de l'action", () => {
    render(
      <ActionDeReferenceContent
        detail={{ status: 'loaded', action: aireCovoiturageAction }}
      />
    );

    expect({
      description: screen.getByText(aireCovoiturageAction.description)
        .textContent,
      levier: screen.getByText('Covoiturage').textContent,
      categorie: screen.getByText('Aménagement & infrastructures').textContent,
    }).toEqual({
      description: aireCovoiturageAction.description,
      levier: 'Covoiturage',
      categorie: 'Aménagement & infrastructures',
    });
  });
});
