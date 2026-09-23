import { fireEvent, render, screen, within } from '@testing-library/react';
import { PertinenceVoletEffective } from '@tet/domain/collectivites';
import { CategorieAction } from '@tet/domain/shared';
import { describe, expect, it } from 'vitest';
import { CategoriesAccordion } from './categories.accordion';
import { LevierCategorie } from './to-levier-cards';

const toCategorie = ({
  categorie,
  pertinenceEffective,
  ficheCount = 0,
}: {
  categorie: CategorieAction;
  pertinenceEffective: PertinenceVoletEffective;
  ficheCount?: number;
}): LevierCategorie => ({ categorie, ficheCount, pertinenceEffective });

const renderOpenedCategories = (categories: LevierCategorie[]): void => {
  render(<CategoriesAccordion categories={categories} />);
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
    render(
      <CategoriesAccordion
        categories={[
          toCategorie({
            categorie: 'amenagement',
            pertinenceEffective: { kind: 'propre' },
          }),
          toCategorie({
            categorie: 'financement',
            pertinenceEffective: { kind: 'propre' },
          }),
        ]}
      />
    );

    const header = screen.getByRole('button', { name: /Catégories/ });

    expect(within(header).getByText('2')).toBeDefined();
  });

  it("ne montre les catégories qu'une fois l'accordéon déplié", () => {
    render(
      <CategoriesAccordion
        categories={[
          toCategorie({
            categorie: 'amenagement',
            pertinenceEffective: { kind: 'propre' },
          }),
        ]}
      />
    );

    expect(screen.queryByText('Aménagement & infrastructures')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Catégories/ }));

    expect(screen.getByText('Aménagement & infrastructures')).toBeDefined();
  });

  it("laisse les actions rattachées aux catégories mobilisées d'un levier non pertinent", () => {
    renderOpenedCategories([
      toCategorie({
        categorie: 'financement',
        pertinenceEffective: { kind: 'mobilise' },
        ficheCount: 2,
      }),
      toCategorie({
        categorie: 'gouvernance',
        pertinenceEffective: { kind: 'heritee_du_levier' },
      }),
    ]);

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
    renderOpenedCategories([
      toCategorie({
        categorie: 'financement',
        pertinenceEffective: { kind: 'mobilise' },
        ficheCount: 1,
      }),
    ]);

    expect(screen.getByText('1 action déjà rattachée')).toBeDefined();
  });

  it('annonce la pertinence posée sur la catégorie', () => {
    renderOpenedCategories([
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
    ]);

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

  it('ne propose aucun sélecteur de pertinence sur les catégories', () => {
    renderOpenedCategories([
      toCategorie({
        categorie: 'exemplarite',
        pertinenceEffective: { kind: 'propre', pertinence: 'pertinent' },
      }),
    ]);

    expect(screen.getByText('Pertinence : pertinent')).toBeDefined();
    expect(screen.queryByRole('group')).toBeNull();
  });
});
