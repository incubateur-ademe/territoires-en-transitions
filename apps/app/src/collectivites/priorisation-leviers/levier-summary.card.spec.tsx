import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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

  it('propose la pertinence en sélecteur, valeur posée enfoncée, à qui peut la modifier', () => {
    const upsertPertinence = vi.fn();
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
        upsertPertinence={upsertPertinence}
      />
    );

    const selector = screen.getByRole('group', {
      name: 'Pertinence du levier Covoiturage',
    });
    expect(
      within(selector)
        .getByRole('button', { name: "À discuter avec l'élu" })
        .getAttribute('aria-pressed')
    ).toBe('true');
    expect(screen.queryByText("Pertinence : à discuter avec l'élu")).toBeNull();

    fireEvent.click(
      within(selector).getByRole('button', { name: 'Pertinent' })
    );

    expect(upsertPertinence).toHaveBeenCalledWith({
      levierId: 'covoiturage',
      pertinence: 'pertinent',
    });
  });

  it('ne propose aucun sélecteur à qui ne peut pas modifier la pertinence', () => {
    render(
      <LevierSummaryCard
        levier={{
          levierId: 'covoiturage',
          nom: 'Covoiturage',
          secteur: 'Transports',
          ficheCount: 0,
          categories: [],
          pertinence: 'pertinent',
        }}
      />
    );

    expect(screen.queryByRole('group')).toBeNull();
    expect(screen.getByText('Pertinence : pertinent')).toBeDefined();
  });

  it("n'enfonce aucune pertinence sur un levier encore non qualifié", () => {
    render(
      <LevierSummaryCard
        levier={{
          levierId: 'biogaz',
          nom: 'Biogaz',
          secteur: 'Branche énergie',
          ficheCount: 0,
          categories: [],
        }}
        upsertPertinence={vi.fn()}
      />
    );

    const selector = screen.getByRole('group', {
      name: 'Pertinence du levier Biogaz',
    });
    expect(
      within(selector)
        .getAllByRole('button')
        .map((button) => button.getAttribute('aria-pressed'))
    ).toEqual(['false', 'false', 'false']);
  });

  it("n'écrit rien quand on clique la pertinence déjà posée", () => {
    const upsertPertinence = vi.fn();
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
        upsertPertinence={upsertPertinence}
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: "À discuter avec l'élu" })
    );

    expect(upsertPertinence).not.toHaveBeenCalled();
  });
});
