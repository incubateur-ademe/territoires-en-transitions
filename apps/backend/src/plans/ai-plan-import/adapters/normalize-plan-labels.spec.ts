import { describe, expect, it } from 'vitest';
import { createEmptyExtractedAction } from '../models/extracted-action';
import { stripTitleNumber, unifyAxisLabels } from './normalize-plan-labels';

describe('stripTitleNumber', () => {
  it.each([
    [
      '2.1.3 Assurer le suivi des consommations',
      'Assurer le suivi des consommations',
    ],
    ['ACTION 3 - ASSURER LE SUIVI', 'ASSURER LE SUIVI'],
    ['Action 1- Piloter et évaluer le PCAET', 'Piloter et évaluer le PCAET'],
    ['1- Assurer la gouvernance du PCAET', 'Assurer la gouvernance du PCAET'],
    ['Fiche n°12 : Développer le covoiturage', 'Développer le covoiturage'],
    [
      '6.2.5. Développer l’énergie hydraulique',
      'Développer l’énergie hydraulique',
    ],
  ])('retire le numéro de « %s »', (titre, expected) => {
    expect(stripTitleNumber(titre)).toBe(expected);
  });

  it.each([
    '10 bornes de recharge sur le territoire',
    '1 000 logements rénovés',
    'Actions de sensibilisation des scolaires',
    'Mesure de la qualité de l’air',
  ])('laisse « %s » tel quel', (titre) => {
    expect(stripTitleNumber(titre)).toBe(titre);
  });
});

describe('unifyAxisLabels', () => {
  const action = (axe: string, sousAxe = '') =>
    createEmptyExtractedAction({ axe, sousAxe, titre: 'Une action' });

  it('donne une seule graphie, en casse normale, à un même axe et à un même sous-axe', () => {
    const actions = unifyAxisLabels([
      action(
        'Axe 6 : DEVELOPPER LE POTENTIEL ENERGETIQUE',
        '6.2  FAVORISER LES ENERGIES RENOUVELABLES'
      ),
      action(
        'Axe 6 : Développer le potentiel énergétique',
        '6.2 Favoriser les énergies renouvelables'
      ),
      action('Axe 6 : DEVELOPPER LE POTENTIEL ENERGETIQUE'),
    ]);

    expect(actions.map(({ axe, sousAxe }) => [axe, sousAxe])).toEqual([
      [
        'Axe 6 : Développer le potentiel énergétique',
        '6.2 Favoriser les énergies renouvelables',
      ],
      [
        'Axe 6 : Développer le potentiel énergétique',
        '6.2 Favoriser les énergies renouvelables',
      ],
      ['Axe 6 : Développer le potentiel énergétique', ''],
    ]);
  });

  it('rapproche des libellés sans numéro aux accents et à la casse près, sans toucher aux autres', () => {
    const actions = unifyAxisLabels([
      action('MOBILITE DURABLE'),
      action('Mobilité durable'),
      action('Habitat'),
      action(''),
    ]);

    expect(actions.map(({ axe }) => axe)).toEqual([
      'Mobilité durable',
      'Mobilité durable',
      'Habitat',
      '',
    ]);
  });
});
