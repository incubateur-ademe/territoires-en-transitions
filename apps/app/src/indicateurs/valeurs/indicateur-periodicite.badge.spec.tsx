import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { IndicateurPeriodiciteBadge } from './indicateur-periodicite.badge';

afterEach(cleanup);

describe('badge de périodicité', () => {
  it('explique la périodicité fixe au clavier', async () => {
    render(<IndicateurPeriodiciteBadge periodicite="mensuelle" />);
    const badge = screen
      .getByText('Mensuelle')
      .closest('[tabindex]') as HTMLElement;
    act(() => badge.focus());
    expect(
      await screen.findByText(
        /La périodicité mensuelle s’applique à la saisie et à l’affichage/
      )
    ).toBeDefined();
  });

  it('explique le suivi annuel des indicateurs du score TETE', async () => {
    render(
      <IndicateurPeriodiciteBadge periodicite="annuelle" participationScore />
    );
    const badge = screen
      .getByText('Annuelle')
      .closest('[tabindex]') as HTMLElement;
    act(() => badge.focus());
    expect(
      await screen.findByText(/il participe au score du programme TETE/)
    ).toBeDefined();
  });
});
