import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LevierSummaryCard } from './levier-summary.card';

describe('LevierSummaryCard', () => {
  it("annonce une pertinence non renseignée quand le levier n'est pas qualifié", () => {
    render(
      <LevierSummaryCard
        levier={{
          levierId: 'biogaz',
          nom: 'Biogaz',
          secteur: 'Branche énergie',
        }}
      />
    );

    expect(screen.getByRole('heading', { name: 'Biogaz' })).toBeDefined();
    expect(screen.getByText('Branche énergie')).toBeDefined();
    expect(screen.getByText('Pertinence : non renseignée')).toBeDefined();
  });

  it('annonce la pertinence posée sur le levier', () => {
    render(
      <LevierSummaryCard
        levier={{
          levierId: 'covoiturage',
          nom: 'Covoiturage',
          secteur: 'Transports',
          pertinence: 'a_discuter',
        }}
      />
    );

    expect(
      screen.getByText("Pertinence : à discuter avec l'élu")
    ).toBeDefined();
  });
});
