import { describe, expect, it } from 'vitest';
import {
  buildDocument,
  buildPage,
  DocumentKind,
  ReadDocument,
} from '../document/document-page';
import { detectDocumentTome } from './detect-document-tome';

const documentFromPages = (
  pagesLines: string[][],
  kind: DocumentKind = 'pdf'
): ReadDocument =>
  buildDocument(
    kind,
    pagesLines.map((lines, index) =>
      buildPage(
        index,
        lines.map((text) => ({ text }))
      )
    )
  );

describe('detectDocumentTome', () => {
  it('accepte un document intitulé programme d’actions', () => {
    const document = documentFromPages([
      ['Belfort Plan Climat', 'Programme d’actions 2024-2030', 'Vizea'],
    ]);
    expect(detectDocumentTome(document)).toEqual({ verdict: 'ok' });
  });

  it('accepte un titre précédé du sigle PCAET', () => {
    const document = documentFromPages([
      ['PCAET — Plan d’actions', '2023-2029'],
    ]);
    expect(detectDocumentTome(document)).toEqual({ verdict: 'ok' });
  });

  it('accepte un titre précédé d’une mention longue du PCAET', () => {
    const document = documentFromPages([
      ['PCAET de la Métropole de Lyon – Fiches actions'],
    ]);
    expect(detectDocumentTome(document)).toEqual({ verdict: 'ok' });
  });

  it('accepte un PCAET global dont le sommaire annonce le programme d’actions', () => {
    const document = documentFromPages([
      ['Plan Climat Air Énergie Territorial'],
      [
        'Sommaire',
        '1. Diagnostic territorial ......... 4',
        '2. Stratégie ......... 52',
        '3. Programme d’actions ......... 78',
      ],
    ]);
    expect(detectDocumentTome(document)).toEqual({ verdict: 'ok' });
  });

  it('refuse une évaluation environnementale stratégique par son titre', () => {
    const document = documentFromPages([
      ['PCAET de la collectivité', 'Évaluation Environnementale Stratégique'],
    ]);
    expect(detectDocumentTome(document)).toEqual({
      verdict: 'wrong_tome',
      tome: 'evaluation_environnementale',
      evidence: 'Évaluation Environnementale Stratégique',
    });
  });

  it('ne prend pas « incidences du programme d’actions » pour un titre de programme', () => {
    const document = documentFromPages([
      ['Tome IV : Évaluation environnementale'],
      [
        'Sommaire',
        'V. Incidences du programme d’actions ......... 40',
        'VI. Mesures d’évitement, de réduction et de compensation ......... 58',
      ],
    ]);
    expect(detectDocumentTome(document)).toMatchObject({
      verdict: 'wrong_tome',
      tome: 'evaluation_environnementale',
    });
  });

  it('refuse une EES sans titre explicite sur deux indices convergents', () => {
    const document = documentFromPages([
      ['Rapport environnemental du PCAET'],
      [
        'Sommaire',
        'État initial de l’environnement ......... 12',
        'Analyse des incidences sur l’environnement ......... 45',
      ],
    ]);
    expect(detectDocumentTome(document)).toMatchObject({
      verdict: 'wrong_tome',
      tome: 'evaluation_environnementale',
    });
  });

  it('ne refuse pas sur un seul indice faible', () => {
    const document = documentFromPages([
      ['Programme opérationnel du territoire'],
      ['Zones Natura 2000 et incidences notables : points de vigilance'],
    ]);
    expect(detectDocumentTome(document)).toEqual({ verdict: 'ok' });
  });

  it('ne refuse pas quand une seule ligne cumule deux indices faibles', () => {
    const document = documentFromPages([
      ['Actions du territoire'],
      ['Annexe : mesures de réduction et incidences Natura 2000'],
    ]);
    expect(detectDocumentTome(document)).toEqual({ verdict: 'ok' });
  });

  it('refuse un diagnostic déposé seul', () => {
    const document = documentFromPages([
      ['PCAET', 'Tome 1 : Diagnostic Climat-Air-Énergie'],
    ]);
    expect(detectDocumentTome(document)).toMatchObject({
      verdict: 'wrong_tome',
      tome: 'diagnostic',
    });
  });

  it('laisse passer une stratégie : hors PCAET elle peut porter des fiches actions', () => {
    const document = documentFromPages([
      ['Stratégie territoriale biodiversité', '2024'],
    ]);
    expect(detectDocumentTome(document)).toEqual({ verdict: 'ok' });
  });

  it('ne confond pas « diagnostic » cité en prose avec un titre de tome', () => {
    const document = documentFromPages([
      ['Plan d’actions'],
      [
        'Cette action prolonge le diagnostic territorial réalisé en 2022 et decline la strategie en mesures concretes portees par les services de la collectivite.',
      ],
    ]);
    expect(detectDocumentTome(document)).toEqual({ verdict: 'ok' });
  });

  it('ignore les pages vides pour trouver la zone de titre', () => {
    const document = documentFromPages([
      [''],
      ['Résumé non technique de l’évaluation environnementale'],
    ]);
    expect(detectDocumentTome(document)).toMatchObject({
      verdict: 'wrong_tome',
      tome: 'evaluation_environnementale',
    });
  });

  it('laisse passer les tableurs sans zone de titre', () => {
    const document = documentFromPages(
      [['action;pilote;budget', 'Rénover les écoles;Ville;10000']],
      'csv'
    );
    expect(detectDocumentTome(document)).toEqual({ verdict: 'ok' });
  });

  it.each([
    ['CRTE du Pays de Redon – Fiches projets'],
    ['Plan de mobilité simplifié', 'Feuille de route 2025-2030'],
    ['Projet alimentaire territorial', 'Programme opérationnel'],
  ])('accepte la partie actions d’un plan hors PCAET : %s', (...lines) => {
    expect(detectDocumentTome(documentFromPages([lines]))).toEqual({
      verdict: 'ok',
    });
  });

  it('accepte un plan global dont le sommaire cite un diagnostic puis ses axes', () => {
    const document = documentFromPages([
      ['Projet de territoire 2030'],
      [
        'Sommaire',
        '1. Diagnostic ......... 4',
        '2. Ambitions ......... 30',
        'Axe 1 : Habiter le territoire ......... 42',
        'Axe 2 : Se déplacer autrement ......... 58',
      ],
    ]);
    expect(detectDocumentTome(document)).toEqual({ verdict: 'ok' });
  });

  it('refuse un diagnostic déposé seul, quel que soit le type de plan', () => {
    const document = documentFromPages([
      ['Plan de mobilité simplifié', 'Diagnostic territorial'],
      ['Sommaire', 'Les déplacements domicile-travail', 'L’offre de transport'],
    ]);
    expect(detectDocumentTome(document)).toMatchObject({
      verdict: 'wrong_tome',
      tome: 'diagnostic',
    });
  });

  it('refuse une évaluation environnementale qui numérote ses mesures', () => {
    const document = documentFromPages([
      ['Schéma directeur des mobilités', 'Évaluation environnementale'],
      [
        'Mesure 1 : Éviter les zones humides',
        'Mesure 2 : Réduire les emprises',
      ],
    ]);
    expect(detectDocumentTome(document)).toMatchObject({
      verdict: 'wrong_tome',
      tome: 'evaluation_environnementale',
    });
  });

  it('laisse passer un document sans aucun marqueur', () => {
    const document = documentFromPages([
      ['Transition écologique', 'Actions du territoire'],
    ]);
    expect(detectDocumentTome(document)).toEqual({ verdict: 'ok' });
  });
});
