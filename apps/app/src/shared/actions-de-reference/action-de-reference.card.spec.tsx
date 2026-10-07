import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActionDeReferenceCard } from './action-de-reference.card';
import {
  isolationComblesAction,
  longDescriptionAction,
} from './actions-de-reference.fixture';

const keepWhitespace = (text: string): string => text;

afterEach(cleanup);

describe('card-affiche-action-entiere', () => {
  it('montre le titre, la description, le libellé du levier et le libellé de la catégorie', () => {
    render(
      <ActionDeReferenceCard
        action={isolationComblesAction}
        updateAccess={{ status: 'forbidden' }}
      />
    );

    expect(
      screen.getByRole('heading', {
        name: 'Isoler les combles perdus des bâtiments communaux',
      })
    ).toBeDefined();
    expect(
      screen.getByText(
        "Programmer l'isolation des combles perdus des écoles et des équipements sportifs."
      )
    ).toBeDefined();
    expect(
      screen.getByText('Sobriété et isolation des bâtiments (tertiaire)')
    ).toBeDefined();
    expect(screen.getByText('Exemplarité interne')).toBeDefined();
  });

  it('montre une description longue en entier, sans la tronquer', () => {
    render(
      <ActionDeReferenceCard
        action={longDescriptionAction}
        updateAccess={{ status: 'forbidden' }}
      />
    );

    expect(
      screen.getByText(longDescriptionAction.description, {
        normalizer: keepWhitespace,
      })
    ).toBeDefined();
  });
});

describe('modification-reservee-super-admin', () => {
  it('sans droit de modification, la card ne porte aucun bouton', () => {
    render(
      <ActionDeReferenceCard
        action={isolationComblesAction}
        updateAccess={{ status: 'forbidden' }}
      />
    );

    expect(
      screen.getByRole('heading', {
        name: 'Isoler les combles perdus des bâtiments communaux',
      })
    ).toBeDefined();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it("avec le droit de modification, le bouton « Modifier l'action » transmet l'action de la card", () => {
    const onUpdate = vi.fn();
    render(
      <ActionDeReferenceCard
        action={isolationComblesAction}
        updateAccess={{ status: 'allowed', onUpdate }}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: "Modifier l'action « Isoler les combles perdus des bâtiments communaux »",
      })
    );

    expect(onUpdate.mock.calls).toEqual([[isolationComblesAction]]);
  });
});
