import { describe, expect, it } from 'vitest';
import {
  createEmptyExtractedAction,
  withAxisPath,
} from '../models/extracted-action';
import {
  stripTitleNumber,
  stripTitleNumbers,
  unifyAxisLabels,
} from './normalize-plan-labels';

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
    ['3/ Développer le réemploi', 'Développer le réemploi'],
    ['2 -DEVELOPPER LE RECOURS', 'DEVELOPPER LE RECOURS'],
  ])('retire le numéro de « %s »', (titre, expected) => {
    expect(stripTitleNumber(titre)).toBe(expected);
  });

  it.each([
    '10 bornes de recharge sur le territoire',
    '1 000 logements rénovés',
    'Actions de sensibilisation des scolaires',
    'Mesure de la qualité de l’air',
    'Mesurer 10 sites pilotes',
    'Actionner 3 leviers fiscaux',
    'Mesures 2030 pour le climat',
    '2-roues : développer le stationnement',
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

  it('écrase les espaces multiples des libellés d’axe et de sous-axe', () => {
    const actions = unifyAxisLabels([
      action(
        'Axe 2  :  Agir pour la mobilité',
        '2.2  Développer  les modes actifs '
      ),
    ]);

    expect(actions.map(({ axe, sousAxe }) => [axe, sousAxe])).toEqual([
      ['Axe 2 : Agir pour la mobilité', '2.2 Développer les modes actifs'],
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

  it('rattache un numéro nu à son seul libellé complet, en capitales ou non', () => {
    const actions = unifyAxisLabels([
      action('AXE 6 : DEVELOPPER LE POTENTIEL', '6.2 FAVORISER LES ENR'),
      action('AXE 6 : DEVELOPPER LE POTENTIEL', '6.2'),
      action('Axe 6'),
    ]);

    expect(actions.map(({ axe, sousAxe }) => [axe, sousAxe])).toEqual([
      ['AXE 6 : DEVELOPPER LE POTENTIEL', '6.2 FAVORISER LES ENR'],
      ['AXE 6 : DEVELOPPER LE POTENTIEL', '6.2 FAVORISER LES ENR'],
      ['AXE 6 : DEVELOPPER LE POTENTIEL', ''],
    ]);
  });

  it('garde distincts deux axes de même numéro mais de titres différents', () => {
    const actions = unifyAxisLabels([
      action('Axe 1 : Mobilité'),
      action('Axe 1 : Qualité de l’air'),
      action('Axe 1'),
    ]);

    expect(actions.map(({ axe }) => axe)).toEqual([
      'Axe 1 : Mobilité',
      'Axe 1 : Qualité de l’air',
      'Axe 1',
    ]);
  });
});

describe('unifyAxisLabels sur un chemin de plusieurs niveaux', () => {
  const onPath = (...path: string[]) =>
    withAxisPath(createEmptyExtractedAction({ titre: 'Une action' }), path);

  it('unifie chaque niveau parmi les libellés qui ont le même parent', () => {
    const actions = unifyAxisLabels([
      onPath('Ambition 1', 'Sobriété', 'RÉNOVER  LES ÉCOLES'),
      onPath('AMBITION 1', 'Sobriété', 'Rénover les écoles'),
      onPath('Ambition 1', 'Mobilité', 'RÉNOVER LES ÉCOLES'),
    ]);

    expect(actions.map(({ cheminAxes }) => cheminAxes)).toEqual([
      ['Ambition 1', 'Sobriété', 'Rénover les écoles'],
      ['Ambition 1', 'Sobriété', 'Rénover les écoles'],
      ['Ambition 1', 'Mobilité', 'RÉNOVER LES ÉCOLES'],
    ]);
    expect(actions.map(({ axe, sousAxe }) => [axe, sousAxe])).toEqual([
      ['Ambition 1', 'Sobriété'],
      ['Ambition 1', 'Sobriété'],
      ['Ambition 1', 'Mobilité'],
    ]);
  });

  it('rattache un numéro nu au troisième niveau, et rapproche un chemin court d’un chemin long', () => {
    const actions = unifyAxisLabels([
      onPath('Axe 1 : Bâtiments', '1.2 Rénover', '1.2.3 Isoler les écoles'),
      onPath('Axe 1 : Bâtiments', '1.2 Rénover', '1.2.3'),
      createEmptyExtractedAction({ axe: 'AXE 1 : BÂTIMENTS', sousAxe: '1.2' }),
    ]);

    expect(actions.map(({ axe, sousAxe }) => [axe, sousAxe])).toEqual([
      ['Axe 1 : Bâtiments', '1.2 Rénover'],
      ['Axe 1 : Bâtiments', '1.2 Rénover'],
      ['Axe 1 : Bâtiments', '1.2 Rénover'],
    ]);
    expect(actions.map(({ cheminAxes }) => cheminAxes)).toEqual([
      ['Axe 1 : Bâtiments', '1.2 Rénover', '1.2.3 Isoler les écoles'],
      ['Axe 1 : Bâtiments', '1.2 Rénover', '1.2.3 Isoler les écoles'],
      undefined,
    ]);
  });
});

describe('stripTitleNumbers', () => {
  it('compare les fiches sur leur chemin complet', () => {
    const onPath = (titre: string, ...path: string[]) =>
      withAxisPath(createEmptyExtractedAction({ titre }), path);

    const actions = stripTitleNumbers([
      onPath('Fiche 3 : Sensibiliser', 'Ambition 1', 'Sobriété', 'Écoles'),
      onPath('Fiche 7 : Sensibiliser', 'Ambition 1', 'Sobriété', 'Écoles'),
      onPath('Fiche 9 : Accompagner', 'Ambition 1', 'Sobriété', 'Écoles'),
      onPath('Fiche 12 : Accompagner', 'Ambition 1', 'Sobriété', 'Mairies'),
    ]);

    expect(actions.map(({ titre }) => titre)).toEqual([
      'Fiche 3 : Sensibiliser',
      'Fiche 7 : Sensibiliser',
      'Accompagner',
      'Accompagner',
    ]);
  });

  it('garde le numéro quand il est seul à distinguer deux fiches du même axe', () => {
    const actions = stripTitleNumbers([
      createEmptyExtractedAction({
        axe: 'Axe 1 : Sensibiliser',
        titre: 'Fiche 3 : Sensibiliser les habitants',
      }),
      createEmptyExtractedAction({
        axe: 'Axe 1 : Sensibiliser',
        titre: 'Fiche 7 : Sensibiliser les habitants',
      }),
      createEmptyExtractedAction({
        axe: 'Axe 1 : Sensibiliser',
        titre: '1.1.2 Former les élus',
      }),
    ]);

    expect(actions.map(({ titre }) => titre)).toEqual([
      'Fiche 3 : Sensibiliser les habitants',
      'Fiche 7 : Sensibiliser les habitants',
      'Former les élus',
    ]);
  });
});
