import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FloatingPanel } from './FloatingPanel';

describe('FloatingPanel', () => {
  it('garde le footer hors de la zone scrollable quand le contenu deborde', () => {
    render(
      <FloatingPanel title="Mes telechargements" onClose={() => undefined}>
        <FloatingPanel.Content>
          <p>Premier element de la liste</p>
        </FloatingPanel.Content>
        <FloatingPanel.Footer>
          <button type="button">Generer une archive</button>
        </FloatingPanel.Footer>
      </FloatingPanel>
    );

    const scrollRegion = screen
      .getByText('Premier element de la liste')
      .closest('.overflow-y-auto');
    const footerButton = screen.getByRole('button', {
      name: 'Generer une archive',
    });

    expect(scrollRegion).not.toBeNull();
    expect(scrollRegion?.contains(footerButton)).toBe(false);
  });

  it('affiche le sous-titre sous le titre quand il est fourni', () => {
    render(
      <FloatingPanel
        title="Mes telechargements"
        subtitle="12 elements en attente"
        onClose={() => undefined}
      >
        <FloatingPanel.Content>
          <p>Premier element de la liste</p>
        </FloatingPanel.Content>
      </FloatingPanel>
    );

    expect(screen.getByText('12 elements en attente')).toBeInTheDocument();
  });
});
