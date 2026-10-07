import { describe, expect, it } from 'vitest';
import { isFicheLabel, matchHeading } from './heading-patterns';

describe('matchHeading', () => {
  it.each([
    ['AXE 1 : UN TERRITOIRE SOBRE', 'axe', 1, '1', 'UN TERRITOIRE SOBRE'],
    ['Axe n°3 - Mobilité', 'axe', 1, '3', 'Mobilité'],
    ['Axe II Habitat', 'axe', 1, 'II', 'Habitat'],
    [
      'AXE STRATEGIQUE 3 - SE DEPLACER SOBREMENT',
      'axe',
      1,
      '3',
      'SE DEPLACER SOBREMENT',
    ],
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
    ['PROGRAMME D’ACTIONS', 'section', 0, null, 'PROGRAMME D’ACTIONS'],
    [
      '3. Stratégie territoriale',
      'section',
      0,
      null,
      '3. Stratégie territoriale',
    ],
    ["PLAN D'ACTIONS À 2030", 'section', 0, null, "PLAN D'ACTIONS À 2030"],
    [
      'Programme d’actions 2024-2030',
      'section',
      0,
      null,
      'Programme d’actions 2024-2030',
    ],
    ['ÉTAT DES LIEUX', 'section', 0, null, 'ÉTAT DES LIEUX'],
    [
      '2) LE PROGRAMME D’ACTIONS',
      'section',
      0,
      null,
      '2) LE PROGRAMME D’ACTIONS',
    ],
    [
      'ENGAGEMENT DES PARTENAIRES',
      'section',
      0,
      null,
      'ENGAGEMENT DES PARTENAIRES',
    ],
    ['I. TOUS HÉROS ORDINAIRES', 'axe', 1, 'I', 'TOUS HÉROS ORDINAIRES'],
    ['IV – UN SYSTÈME DE MOBILITÉ', 'axe', 1, 'IV', 'UN SYSTÈME DE MOBILITÉ'],
    [
      'Orientation stratégique 3 : Se déplacer autrement',
      'orientation',
      2,
      '3',
      'Se déplacer autrement',
    ],
    [
      'Évaluation environnementale stratégique',
      'section',
      0,
      null,
      'Évaluation environnementale stratégique',
    ],
    ['Résumé non technique', 'section', 0, null, 'Résumé non technique'],
    [
      'État initial de l’environnement',
      'section',
      0,
      null,
      'État initial de l’environnement',
    ],
    [
      'Analyse des incidences sur Natura 2000',
      'section',
      0,
      null,
      'Analyse des incidences sur Natura 2000',
    ],
    [
      'Diagnostic climat-air-énergie',
      'section',
      0,
      null,
      'Diagnostic climat-air-énergie',
    ],
    [
      'Vue d’ensemble du programme d’actions',
      'section',
      0,
      null,
      'Vue d’ensemble du programme d’actions',
    ],
    [
      'Annexe 2 : Tableau de suivi des actions',
      'section',
      0,
      null,
      'Annexe 2 : Tableau de suivi des actions',
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

  it('prend un chiffre romain devant un titre en casse mixte pour un axe, en grande police seulement', () => {
    expect(matchHeading('II. Une économie sobre')).toBeNull();
    expect(
      matchHeading('II. Une économie sobre', { isLarge: true })
    ).toMatchObject({ kind: 'axe', number: 'II', title: 'Une économie sobre' });
  });

  it('prend un numéro seul devant un titre en majuscules pour une fiche, en grande police seulement', () => {
    expect(
      matchHeading('1 DANS L’ÉCO-RESPONSABILITÉ', { isLarge: true })
    ).toMatchObject({
      kind: 'numero',
      level: 3,
      number: '1',
      title: 'DANS L’ÉCO-RESPONSABILITÉ',
    });
    expect(matchHeading('1 DANS L’ÉCO-RESPONSABILITÉ')).toBeNull();
    expect(matchHeading('10 communes engagées', { isLarge: true })).toBeNull();
  });

  it.each([
    '1.5 tonnes de CO2 évitées par an',
    '2.3 % de la consommation',
    'Axe : 2',
    'Pilote :',
    // L'en-tête d'un tableau récapitulatif, pas l'axe « I ».
    "Axe stratégique Intitulé de l'action",
    // Un libellé de fiche collé à sa valeur, pas l'objectif « s ».
    'Objectifs et enjeux de Réduire la consommation énergétique',
    'INDICATEURS DE SUIVI',
    'Cette action vise à réduire les consommations des bâtiments communaux de vingt pour cent d’ici à la fin du mandat.',
    'ABC',
    '400 000 € SYTRAL',
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
    'Structure porteuse',
    'Moyens humains',
    'Sources de financement et subventions :',
    'Temps de mise en œuvre',
    'Étapes de mise en œuvre :',
    'Partenaires / financeurs',
    'Trajectoire',
    'Gains estimés',
    'Impacts de l’action',
    'Actions opérationnelles',
  ])('reconnaît le libellé « %s »', (label) => {
    expect(isFicheLabel(label)).toBe(true);
  });

  it('ne prend pas un titre pour un libellé', () => {
    expect(isFicheLabel('Budget participatif des quartiers')).toBe(false);
  });
});
