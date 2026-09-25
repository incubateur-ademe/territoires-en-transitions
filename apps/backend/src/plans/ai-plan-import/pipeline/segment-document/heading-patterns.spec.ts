import { describe, expect, it } from 'vitest';
import { isFicheLabel, matchHeading } from './heading-patterns';

describe('matchHeading', () => {
  it.each([
    ['AXE 1 : UN TERRITOIRE SOBRE', 'axe', 1, '1', 'UN TERRITOIRE SOBRE'],
    ['Axe n°3 - Mobilité', 'axe', 1, '3', 'Mobilité'],
    ['Axe II Habitat', 'axe', 1, 'II', 'Habitat'],
    [
      'Orientation 2.3 – Rénover l’habitat',
      'orientation',
      2,
      '2.3',
      'Rénover l’habitat',
    ],
    ['Objectif stratégique 4 : Sobriété', 'orientation', 2, '4', 'Sobriété'],
    [
      'Sous-axe 1.2 Réseaux de chaleur',
      'orientation',
      2,
      '1.2',
      'Réseaux de chaleur',
    ],
    [
      'Défi B : Adapter le territoire',
      'orientation',
      2,
      'B',
      'Adapter le territoire',
    ],
    [
      'Fiche n°12 Développer le covoiturage',
      'fiche',
      3,
      '12',
      'Développer le covoiturage',
    ],
    [
      'FICHE ACTION 1.2.4 : Isoler la mairie',
      'fiche',
      3,
      '1.2.4',
      'Isoler la mairie',
    ],
    [
      'Action 2.3.1 – Créer une maison de l’habitat',
      'fiche',
      3,
      '2.3.1',
      'Créer une maison de l’habitat',
    ],
    ['Fiche-action MOB-03 Vélo', 'fiche', 3, 'MOB-03', 'Vélo'],
    ['Mesure 7 : Éclairage public', 'fiche', 3, '7', 'Éclairage public'],
    [
      '1.2 Diagnostic énergétique',
      'orientation',
      2,
      '1.2',
      'Diagnostic énergétique',
    ],
    ['2.3.1. Rénover les écoles', 'fiche', 3, '2.3.1', 'Rénover les écoles'],
    ['## Fiche action 3', 'markdown', 2, null, 'Fiche action 3'],
    ['### 2.3 Rénover', 'markdown', 3, '2.3', 'Rénover'],
    ['PROGRAMME D’ACTIONS', 'section', 1, null, 'PROGRAMME D’ACTIONS'],
    [
      '3. Stratégie territoriale',
      'section',
      1,
      null,
      '3. Stratégie territoriale',
    ],
  ])('reconnaît « %s »', (line, kind, level, number, title) => {
    expect(matchHeading(line)).toMatchObject({ kind, level, number, title });
  });

  it('prend une ligne en majuscules pour un titre, plus sûrement en grande police', () => {
    expect(matchHeading('RÉNOVER LE PATRIMOINE BÂTI')).toMatchObject({
      kind: 'majuscules',
      level: 2,
      confidence: 0.6,
    });
    expect(
      matchHeading('RÉNOVER LE PATRIMOINE BÂTI', { isLarge: true })
    ).toMatchObject({ level: 1, confidence: 0.8 });
  });

  it.each([
    '1.5 tonnes de CO2 évitées par an',
    '2.3 % de la consommation',
    'Axe : 2',
    'Pilote :',
    'INDICATEURS DE SUIVI',
    'Cette action vise à réduire les consommations des bâtiments communaux de vingt pour cent d’ici à la fin du mandat.',
    'ABC',
    '',
  ])('ne prend pas « %s » pour un titre', (line) => {
    expect(matchHeading(line)).toBeNull();
  });

  it('refuse un titre trop long', () => {
    expect(matchHeading(`Axe 1 : ${'x'.repeat(130)}`)).toBeNull();
  });
});

describe('isFicheLabel', () => {
  it.each([
    'Pilote :',
    'Budget',
    'Indicateurs de suivi :',
    'ÉTAT D’AVANCEMENT',
    'Maître d’ouvrage',
  ])('reconnaît le libellé « %s »', (label) => {
    expect(isFicheLabel(label)).toBe(true);
  });

  it('ne prend pas un titre pour un libellé', () => {
    expect(isFicheLabel('Budget participatif des quartiers')).toBe(false);
  });
});
