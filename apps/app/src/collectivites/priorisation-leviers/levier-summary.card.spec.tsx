import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LevierSummaryCard } from './levier-summary.card';

describe('LevierSummaryCard', () => {
  it("annonce une pertinence non renseignée et aucune action quand le levier n'est ni qualifié ni mobilisé", () => {
    render(
      <LevierSummaryCard
        levier={{
          levierId: 'biogaz',
          nom: 'Biogaz',
          secteur: 'Branche énergie',
          ficheCount: 0,
          categories: [],
        }}
      />
    );

    expect(screen.getByRole('heading', { name: 'Biogaz' })).toBeDefined();
    expect(screen.getByText('Branche énergie')).toBeDefined();
    expect(screen.getByText('Pertinence : non renseignée')).toBeDefined();
    expect(screen.getByText('Aucune action rattachée')).toBeDefined();
  });

  it('annonce la pertinence posée sur le levier', () => {
    render(
      <LevierSummaryCard
        levier={{
          levierId: 'covoiturage',
          nom: 'Covoiturage',
          secteur: 'Transports',
          ficheCount: 0,
          categories: [],
          pertinence: 'a_discuter',
        }}
      />
    );

    expect(
      screen.getByText("Pertinence : à discuter avec l'élu")
    ).toBeDefined();
  });

  it('accorde au singulier une seule action rattachée', () => {
    render(
      <LevierSummaryCard
        levier={{
          levierId: 'covoiturage',
          nom: 'Covoiturage',
          secteur: 'Transports',
          ficheCount: 1,
          categories: [],
        }}
      />
    );

    expect(screen.getByText('1 action déjà rattachée')).toBeDefined();
  });

  it('accorde au pluriel plusieurs actions rattachées', () => {
    render(
      <LevierSummaryCard
        levier={{
          levierId: 'covoiturage',
          nom: 'Covoiturage',
          secteur: 'Transports',
          ficheCount: 2,
          categories: [],
        }}
      />
    );

    expect(screen.getByText('2 actions déjà rattachées')).toBeDefined();
  });
});
