import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { uiLabels } from '../../labels/catalog';
import { Breadcrumbs } from './Breadcrumbs';

const items = [
  { label: 'Plan climat', onClick: vi.fn() },
  { label: 'Axe 1', onClick: vi.fn() },
  { label: 'Sous-axe 1.1', onClick: vi.fn() },
  { label: 'Objectif 1.1.1', onClick: vi.fn() },
];

describe('Breadcrumbs — niveaux du milieu repliés', () => {
  it('affiche le premier et le dernier niveau, et masque ceux du milieu', () => {
    render(<Breadcrumbs items={items} collapseMiddleItems />);

    expect(screen.getByText('Plan climat')).toBeInTheDocument();
    expect(screen.getByText('Objectif 1.1.1')).toBeInTheDocument();
    expect(screen.queryByText('Axe 1')).toBeNull();
    expect(screen.queryByText('Sous-axe 1.1')).toBeNull();
    expect(
      screen.getByRole('button', {
        name: uiLabels.afficherNiveauxMasques({ count: 2 }),
      })
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('déplie tous les niveaux puis les replie avec « Réduire »', () => {
    render(<Breadcrumbs items={items} collapseMiddleItems />);

    fireEvent.click(
      screen.getByRole('button', {
        name: uiLabels.afficherNiveauxMasques({ count: 2 }),
      })
    );
    expect(screen.getByText('Axe 1')).toBeInTheDocument();
    expect(screen.getByText('Sous-axe 1.1')).toBeInTheDocument();

    const reduire = screen.getByRole('button', { name: uiLabels.reduire });
    expect(reduire).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(reduire);
    expect(screen.queryByText('Axe 1')).toBeNull();
  });

  it('ne tronque plus les libellés une fois déplié', () => {
    render(<Breadcrumbs items={items} collapseMiddleItems truncateItems />);

    expect(screen.getByText('Plan climat')).toHaveClass('truncate');
    fireEvent.click(
      screen.getByRole('button', {
        name: uiLabels.afficherNiveauxMasques({ count: 2 }),
      })
    );
    expect(screen.getByText('Plan climat')).not.toHaveClass('truncate');
  });

  it('ne replie rien avec trois niveaux ou moins', () => {
    render(<Breadcrumbs items={items.slice(0, 3)} collapseMiddleItems />);

    expect(screen.getByText('Plan climat')).toBeInTheDocument();
    expect(screen.getByText('Axe 1')).toBeInTheDocument();
    expect(screen.getByText('Sous-axe 1.1')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: uiLabels.reduire })
    ).toBeNull();
    expect(screen.queryByRole('button', { name: /niveau/ })).toBeNull();
  });
});
