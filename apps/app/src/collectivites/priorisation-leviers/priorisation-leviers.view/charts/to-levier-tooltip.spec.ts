import { Pertinence } from '@tet/domain/collectivites';
import { describe, expect, it } from 'vitest';
import { toCategorieTooltip, toLevierTooltip } from './to-levier-tooltip';

const toLevier = ({
  mobilisationScore,
  pertinence,
}: {
  mobilisationScore: number;
  pertinence?: Pertinence;
}) =>
  toLevierTooltip({
    nom: 'Sobriété et isolation des bâtiments (tertiaire)',
    impactIndex: 19,
    potentielScore: 80,
    mobilisationScore,
    pertinence,
  });

describe('toLevierTooltip', () => {
  it('lit le quadrant du levier et son impact, porte la mobilisation en badge et invite à voir les actions', () => {
    expect(toLevier({ mobilisationScore: 22 })).toEqual({
      title: 'Sobriété et isolation des bâtiments (tertiaire)',
      lines: [
        'Levier à prioriser : fort impact, peu mobilisé',
        'Impact potentiel estimé : 19/100',
      ],
      badge: { label: 'Peu mobilisé', variant: 'warning' },
      hint: 'Cliquer pour voir les actions',
    });
  });

  it('signale un levier marqué non pertinent dans le hint', () => {
    expect(
      toLevier({ mobilisationScore: 22, pertinence: 'non_pertinent' }).hint
    ).toBe('Marqué non pertinent. Cliquer pour ouvrir');
  });

  it.each([
    [0, 'Non mobilisé'],
    [22, 'Peu mobilisé'],
    [49, 'Peu mobilisé'],
    [50, 'Bien mobilisé'],
    [84, 'Très mobilisé'],
    [100, 'Très mobilisé'],
  ])(
    'donne le niveau de mobilisation %i → %s',
    (mobilisationScore, expectedLevel) => {
      expect(toLevier({ mobilisationScore }).badge.label).toBe(expectedLevel);
    }
  );
});

describe('toCategorieTooltip', () => {
  const COVOITURAGE_FINANCEMENT = {
    levierNom: 'Covoiturage',
    categorie: 'financement',
    impactIndex: 12,
    note: 2,
  } as const;

  it("nomme le sous-levier, donne l'impact de la catégorie et sa mobilisation en badge", () => {
    expect(toCategorieTooltip(COVOITURAGE_FINANCEMENT)).toEqual({
      title: 'Covoiturage · Financement & fiscalité',
      lines: ['Impact potentiel estimé : 12/100'],
      badge: { label: 'Bien mobilisé', variant: 'success' },
      hint: 'Cliquer pour voir les actions',
    });
  });

  it('signale dans le hint que le levier de la catégorie est marqué non pertinent', () => {
    expect(
      toCategorieTooltip({
        ...COVOITURAGE_FINANCEMENT,
        pertinence: 'non_pertinent',
      }).hint
    ).toBe('Marqué non pertinent. Cliquer pour ouvrir');
  });
});
