import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActionCard } from './action-card';

afterEach(cleanup);

describe('ActionCard', () => {
  it("affiche l'en-tête, le contenu et le pied", () => {
    render(
      <ActionCard header="En-tête" footer="Pied">
        Contenu
      </ActionCard>
    );

    expect(screen.getByText('En-tête')).toBeTruthy();
    expect(screen.getByText('Contenu')).toBeTruthy();
    expect(screen.getByText('Pied')).toBeTruthy();
  });

  it('garde les actions de survol dans le DOM, accessibles par leur rôle', () => {
    render(
      <ActionCard hoverActions={<button type="button">Modifier</button>}>
        Contenu
      </ActionCard>
    );

    expect(screen.getByRole('button', { name: 'Modifier' })).toBeTruthy();
  });

  it('en lien, place les actions de survol à côté du lien et non dedans', () => {
    render(
      <ActionCard
        href="/actions/1"
        hoverActions={<button type="button">Modifier</button>}
      >
        Contenu
      </ActionCard>
    );

    const link = screen.getByRole('link');
    const button = screen.getByRole('button', { name: 'Modifier' });

    expect(link.getAttribute('href')).toBe('/actions/1');
    expect(link.contains(button)).toBe(false);
  });

  it('pose le libellé accessible sur la carte et non sur son enveloppe', () => {
    render(<ActionCard aria-label="Aires de covoiturage">Contenu</ActionCard>);

    const card = screen.getByLabelText('Aires de covoiturage');

    expect(card.textContent).toBe('Contenu');
    expect(card.parentElement?.hasAttribute('aria-label')).toBe(false);
  });

  it("retire les actions de survol d'une carte désactivée", () => {
    render(
      <ActionCard
        disabled
        hoverActions={<button type="button">Modifier</button>}
      >
        Contenu
      </ActionCard>
    );

    expect(screen.queryByRole('button', { name: 'Modifier' })).toBeNull();
  });

  it('transmet le clic à la carte', () => {
    const onClick = vi.fn();
    render(<ActionCard onClick={onClick}>Contenu</ActionCard>);

    fireEvent.click(screen.getByText('Contenu'));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("ignore le clic d'une carte désactivée", () => {
    const onClick = vi.fn();
    render(
      <ActionCard disabled onClick={onClick}>
        Contenu
      </ActionCard>
    );

    fireEvent.click(screen.getByText('Contenu'));

    expect(onClick).not.toHaveBeenCalled();
  });
});
