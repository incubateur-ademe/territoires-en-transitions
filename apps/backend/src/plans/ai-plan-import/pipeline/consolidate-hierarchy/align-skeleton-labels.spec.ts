import { describe, expect, it } from 'vitest';
import { alignSkeletonLabels } from './align-skeleton-labels';

const skeleton = {
  axes: [
    {
      numero: '1',
      titre: 'Un territoire résilient',
      sousAxes: [
        { numero: '1.4', titre: 'Désimperméabilisation et végétalisation' },
        { numero: '1.5', titre: 'Sobriété foncière' },
      ],
    },
    {
      numero: '3',
      titre: "Un territoire sobre et producteur d'énergie verte",
      sousAxes: [
        {
          numero: '3.1',
          titre: "Développer la production locale d'énergies renouvelables",
        },
        {
          numero: '3.2',
          titre: 'Développer la production locale de chaleur renouvelable',
        },
      ],
    },
  ],
};

const align = alignSkeletonLabels(skeleton);

describe('alignSkeletonLabels', () => {
  it('reprend la graphie du squelette malgré une faute de frappe, une apostrophe ou une espace en trop', () => {
    expect(
      align({
        axe: 'Axe 3 : Un territoire sobre et producteur d’énergie verte',
        sousAxe: "3.1  Dévelopir la production locale d'énergies renouvelables",
      })
    ).toEqual({
      axe: "Axe 3 : Un territoire sobre et producteur d'énergie verte",
      sousAxe: "3.1 Développer la production locale d'énergies renouvelables",
    });
  });

  it('donne son titre à un sous-axe rendu par son seul numéro', () => {
    expect(align({ axe: 'Axe 1', sousAxe: '1.5' })).toEqual({
      axe: 'Axe 1 : Un territoire résilient',
      sousAxe: '1.5 Sobriété foncière',
    });
  });

  it('retrouve une entrée par son seul titre quand il n’en désigne qu’une', () => {
    expect(
      align({ axe: 'Un territoire résilient', sousAxe: 'Sobriété foncière' })
    ).toEqual({
      axe: 'Axe 1 : Un territoire résilient',
      sousAxe: '1.5 Sobriété foncière',
    });
  });

  it('rend à sa mesure une action dont le titre a été pris pour le sous-axe', () => {
    expect(
      align({
        axe: 'Axe 1 : Un territoire résilient',
        sousAxe: '1.5 Créer de nouveaux arrêts pour la ligne de bus',
      }).sousAxe
    ).toBe('1.5 Sobriété foncière');
  });

  it('laisse tel quel un niveau dont le squelette n’a ni le titre ni le numéro', () => {
    const labels = {
      axe: 'Axe 2 : Qualité de l’air',
      sousAxe: '2.4 Préserver et restaurer la biodiversité',
    };

    expect(align(labels)).toEqual(labels);
  });

  it('ne tranche pas entre deux titres proches sans numéro, et garde un sous-axe vide', () => {
    expect(
      align({ axe: '', sousAxe: 'Développer la production locale' }).sousAxe
    ).toBe('Développer la production locale');
    expect(
      align({ axe: 'Axe 1 : Un territoire résilient', sousAxe: '' })
    ).toEqual({ axe: 'Axe 1 : Un territoire résilient', sousAxe: '' });
  });
});
