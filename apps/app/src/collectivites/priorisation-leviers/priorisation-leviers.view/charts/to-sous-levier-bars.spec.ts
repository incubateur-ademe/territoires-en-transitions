import { actionDeReferenceIdSchema } from '@tet/domain/shared';
import { describe, expect, it } from 'vitest';
import { NO_MOBILISATION } from '../data/to-leviers-priorisation';
import { LevierPlace } from '../data/to-matrix-points';
import { toSousLevierBars } from './to-sous-levier-bars';

const toPlace = (
  overrides: Partial<LevierPlace> & Pick<LevierPlace, 'levierId'>
): LevierPlace => ({
  nom: 'Production industrielle',
  secteur: 'Industrie',
  ficheCount: 0,
  mobilisationScore: 0,
  noteByCategorie: NO_MOBILISATION,
  potentielReduction: 10,
  potentielScore: 90,
  ...overrides,
});

describe('toSousLevierBars', () => {
  it('fait une barre par catégorie du levier, nommée levier · catégorie et colorée par sa mobilisation', () => {
    const bars = toSousLevierBars(
      [
        toPlace({
          levierId: 'production_industrielle',
          potentielReduction: 20,
          noteByCategorie: { ...NO_MOBILISATION, financement: 2 },
        }),
      ],
      []
    );

    expect(bars).toEqual([
      {
        id: 'production_industrielle/financement',
        label: 'Production industrielle · Financement & fiscalité',
        value: 10,
        status: 'Bien mobilisé',
        levierId: 'production_industrielle',
        categorie: 'financement',
      },
      {
        id: 'production_industrielle/gouvernance',
        label: 'Production industrielle · Gouvernance & partenariats',
        value: 8,
        status: 'Non mobilisé',
        levierId: 'production_industrielle',
        categorie: 'gouvernance',
      },
      {
        id: 'production_industrielle/sensibilisation',
        label: 'Production industrielle · Sensibilisation & accompagnement',
        value: 2,
        status: 'Non mobilisé',
        levierId: 'production_industrielle',
        categorie: 'sensibilisation',
      },
    ]);
  });

  it('trie les sous-leviers de tous les leviers par potentiel décroissant', () => {
    const bars = toSousLevierBars(
      [
        toPlace({
          levierId: 'production_industrielle',
          potentielReduction: 20,
        }),
        toPlace({
          levierId: 'covoiturage',
          nom: 'Covoiturage',
          potentielReduction: 100,
        }),
      ],
      []
    );

    const values = bars.map(({ value }) => value);
    expect(values).toEqual([...values].sort((first, second) => second - first));
    expect(bars[0].levierId).toBe('covoiturage');
  });

  it('écarte les leviers sans potentiel de réduction', () => {
    const bars = toSousLevierBars(
      [toPlace({ levierId: 'covoiturage', potentielReduction: 0 })],
      []
    );

    expect(bars).toEqual([]);
  });

  it("passe en Ajoutée la barre de la catégorie d'une action sauvegardée, sans toucher aux autres catégories du levier", () => {
    const bars = toSousLevierBars(
      [
        toPlace({
          levierId: 'production_industrielle',
          potentielReduction: 20,
          noteByCategorie: { ...NO_MOBILISATION, financement: 2 },
        }),
      ],
      [
        {
          id: actionDeReferenceIdSchema.parse(1),
          titre: 'Subventionner les entreprises',
          description: 'Aides financières',
          levier: 'production_industrielle',
          categorie: 'financement',
        },
      ]
    );

    const statusById = Object.fromEntries(
      bars.map(({ id, status }) => [id, status])
    );
    expect(statusById).toEqual({
      'production_industrielle/financement': 'Ajoutée',
      'production_industrielle/gouvernance': 'Non mobilisé',
      'production_industrielle/sensibilisation': 'Non mobilisé',
    });
  });
});
