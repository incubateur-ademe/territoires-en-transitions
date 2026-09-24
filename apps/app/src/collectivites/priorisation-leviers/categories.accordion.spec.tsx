import { fireEvent, render, screen, within } from '@testing-library/react';
import { PertinenceVoletEffective } from '@tet/domain/collectivites';
import { CategorieAction } from '@tet/domain/shared';
import { describe, expect, it, vi } from 'vitest';
import { CategoriesAccordion } from './categories.accordion';
import { UpsertPertinence } from './data/use-upsert-pertinence';
import { LevierCard, LevierCategorie } from './to-levier-cards';

const toCategorie = ({
  categorie,
  pertinenceEffective,
  ficheCount = 0,
}: {
  categorie: CategorieAction;
  pertinenceEffective: PertinenceVoletEffective;
  ficheCount?: number;
}): LevierCategorie => ({ categorie, ficheCount, pertinenceEffective });

const toLevier = (
  categories: LevierCategorie[]
): Pick<LevierCard, 'levierId' | 'nom' | 'categories'> => ({
  levierId: 'biogaz',
  nom: 'Biogaz',
  categories,
});

const renderCategories = ({
  categories,
  upsertPertinence,
}: {
  categories: LevierCategorie[];
  upsertPertinence?: UpsertPertinence;
}): void => {
  render(
    <CategoriesAccordion
      levier={toLevier(categories)}
      upsertPertinence={upsertPertinence}
    />
  );
};

const renderOpenedCategories = (input: {
  categories: LevierCategorie[];
  upsertPertinence?: UpsertPertinence;
}): void => {
  renderCategories(input);
  fireEvent.click(screen.getByRole('button', { name: /Catégories/ }));
};

const categorieRow = (nom: string): HTMLElement => {
  const row = screen
    .getAllByRole('listitem')
    .find((candidate) => within(candidate).queryByText(nom) !== null);
  if (row === undefined) {
    throw new Error(`No category row named ${nom}`);
  }
  return row;
};

describe('CategoriesAccordion', () => {
  it('compte les catégories dans le titre', () => {
    renderCategories({
      categories: [
        toCategorie({
          categorie: 'amenagement',
          pertinenceEffective: { kind: 'propre' },
        }),
        toCategorie({
          categorie: 'financement',
          pertinenceEffective: { kind: 'propre' },
        }),
      ],
    });

    const header = screen.getByRole('button', { name: /Catégories/ });

    expect(within(header).getByText('2')).toBeDefined();
  });

  it("ne montre les catégories qu'une fois l'accordéon déplié", () => {
    renderCategories({
      categories: [
        toCategorie({
          categorie: 'amenagement',
          pertinenceEffective: { kind: 'propre' },
        }),
      ],
    });

    expect(screen.queryByText('Aménagement & infrastructures')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Catégories/ }));

    expect(screen.getByText('Aménagement & infrastructures')).toBeDefined();
  });

  it("laisse les actions rattachées aux catégories mobilisées d'un levier non pertinent", () => {
    renderOpenedCategories({
      categories: [
        toCategorie({
          categorie: 'financement',
          pertinenceEffective: { kind: 'mobilise' },
          ficheCount: 2,
        }),
        toCategorie({
          categorie: 'gouvernance',
          pertinenceEffective: { kind: 'heritee_du_levier' },
        }),
      ],
    });

    expect(
      within(categorieRow('Financement & fiscalité')).getByText(
        '2 actions déjà rattachées'
      )
    ).toBeDefined();
    expect(
      within(categorieRow('Gouvernance & partenariats')).getByText(
        'Non pertinent, comme le levier'
      )
    ).toBeDefined();
  });

  it('accorde au singulier une seule action rattachée à la catégorie', () => {
    renderOpenedCategories({
      categories: [
        toCategorie({
          categorie: 'financement',
          pertinenceEffective: { kind: 'mobilise' },
          ficheCount: 1,
        }),
      ],
    });

    expect(screen.getByText('1 action déjà rattachée')).toBeDefined();
  });

  it('annonce la pertinence posée sur la catégorie', () => {
    renderOpenedCategories({
      categories: [
        toCategorie({
          categorie: 'exemplarite',
          pertinenceEffective: { kind: 'propre', pertinence: 'a_discuter' },
        }),
        toCategorie({
          categorie: 'planification',
          pertinenceEffective: { kind: 'propre', pertinence: 'non_pertinent' },
        }),
        toCategorie({
          categorie: 'sensibilisation',
          pertinenceEffective: { kind: 'propre' },
        }),
      ],
    });

    expect(
      within(categorieRow('Exemplarité interne')).getByText(
        "Pertinence : à discuter avec l'élu"
      )
    ).toBeDefined();
    expect(
      within(categorieRow('Réglementation & planification')).getByText(
        'Pertinence : non pertinent'
      )
    ).toBeDefined();
    expect(
      within(categorieRow('Sensibilisation & accompagnement')).getByText(
        'Pertinence : non renseignée'
      )
    ).toBeDefined();
  });

  it('propose la pertinence en sélecteur sur une catégorie à pertinence propre', () => {
    const upsertPertinence = vi.fn();
    renderOpenedCategories({
      categories: [
        toCategorie({
          categorie: 'planification',
          pertinenceEffective: { kind: 'propre' },
        }),
        toCategorie({
          categorie: 'exemplarite',
          pertinenceEffective: { kind: 'propre', pertinence: 'a_discuter' },
        }),
      ],
      upsertPertinence,
    });

    const selector = screen.getByRole('group', {
      name: 'Pertinence de la catégorie Exemplarité interne pour le levier Biogaz',
    });
    expect(
      within(selector)
        .getByRole('button', { name: "À discuter avec l'élu" })
        .getAttribute('aria-pressed')
    ).toBe('true');
    expect(screen.queryByText("Pertinence : à discuter avec l'élu")).toBeNull();

    fireEvent.click(
      within(selector).getByRole('button', { name: 'Non pertinent' })
    );

    expect(upsertPertinence).toHaveBeenCalledWith({
      levierId: 'biogaz',
      categorie: 'exemplarite',
      pertinence: 'non_pertinent',
    });
  });

  it('ne propose aucun sélecteur sur une catégorie mobilisée', () => {
    renderOpenedCategories({
      categories: [
        toCategorie({
          categorie: 'financement',
          pertinenceEffective: { kind: 'mobilise' },
          ficheCount: 2,
        }),
      ],
      upsertPertinence: vi.fn(),
    });

    expect(screen.getByText('2 actions déjà rattachées')).toBeDefined();
    expect(
      screen.queryByRole('group', { name: /^Pertinence de la catégorie / })
    ).toBeNull();
  });

  it("ne propose aucun sélecteur sur une catégorie qui hérite d'un levier non pertinent", () => {
    renderOpenedCategories({
      categories: [
        toCategorie({
          categorie: 'gouvernance',
          pertinenceEffective: { kind: 'heritee_du_levier' },
        }),
      ],
      upsertPertinence: vi.fn(),
    });

    expect(screen.getByText('Non pertinent, comme le levier')).toBeDefined();
    expect(
      screen.queryByRole('group', { name: /^Pertinence de la catégorie / })
    ).toBeNull();
  });

  it('ne propose aucun sélecteur à qui ne peut pas modifier la pertinence', () => {
    renderOpenedCategories({
      categories: [
        toCategorie({
          categorie: 'exemplarite',
          pertinenceEffective: { kind: 'propre', pertinence: 'pertinent' },
        }),
      ],
    });

    expect(screen.getByText('Pertinence : pertinent')).toBeDefined();
    expect(
      screen.queryByRole('group', { name: /^Pertinence de la catégorie / })
    ).toBeNull();
  });
});
