import { describe, expect, it } from 'vitest';
import type { DocumentUnit } from '../../pipeline/segment-document/document-unit';
import type { ManualReference } from '../eval-metrics';
import { scoreSegmentation } from './score-segmentation';

const AXE_1 = '1 Réduire les biodéchets';
const AXE_2 = '2 Réemployer';

const reference: ManualReference = {
  manual: true,
  document: 'Plan fictif',
  niveaux: ['fiche', 'etape'],
  axes: [AXE_1, AXE_2],
  actions: [
    {
      axe: AXE_1,
      numero: '1.1',
      titre: 'Développer le compostage partagé dans les quartiers',
      etapes: [
        { numero: '1', titre: 'Recenser les sites disponibles' },
        { numero: '2', titre: 'Former les guides composteurs' },
      ],
    },
    {
      axe: AXE_1,
      numero: '1.2',
      titre: 'Lutter contre le gaspillage alimentaire',
    },
    {
      axe: AXE_2,
      numero: '2.1',
      titre: 'Ouvrir une ressourcerie intercommunale',
    },
  ],
};

const fiche = (
  title: string,
  headingPath: string[],
  extra: Partial<DocumentUnit> = {}
): DocumentUnit => ({
  id: '',
  lines: [],
  text: title,
  pageStart: 0,
  pageEnd: 0,
  headingPath,
  title,
  kind: 'fiche',
  tokenEstimate: 100,
  ...extra,
});

describe('scoreSegmentation', () => {
  it('compte une fiche retrouvée à son titre, son numéro et son chemin', () => {
    const { score, detail } = scoreSegmentation(
      [
        fiche('1.1 Développer le compostage partagé dans les quartiers', [
          AXE_1,
        ]),
        fiche('1.2 Lutter contre le gaspillage alimentaire', [AXE_1]),
        fiche('2.1 Ouvrir une ressourcerie intercommunale', [AXE_2]),
      ],
      reference,
      'fiche'
    );
    expect(score).toEqual({
      attendues: 3,
      trouvees: 3,
      titresComplets: 3,
      numerosAttendus: 3,
      numeros: 3,
      bonAxe: 3,
      bonChemin: 3,
      enTrop: 0,
      axesAttendus: 2,
      axesTrouves: 2,
      axesComplets: 2,
    });
    expect(detail.manquantes).toEqual([]);
  });

  it('distingue le titre écourté, le numéro perdu, la fiche mal rangée et l’unité en trop', () => {
    const { score, detail } = scoreSegmentation(
      [
        fiche('1.1 Développer le compostage partagé', [AXE_1]),
        fiche('Lutter contre le gaspillage alimentaire', [AXE_1]),
        fiche('2.1 Ouvrir une ressourcerie intercommunale', [AXE_1]),
        fiche('Pilote : service déchets', [AXE_2]),
      ],
      reference,
      'fiche'
    );
    expect(score).toMatchObject({
      trouvees: 3,
      titresComplets: 2,
      numeros: 2,
      bonAxe: 2,
      enTrop: 1,
      axesTrouves: 2,
    });
    expect(detail.titresEcourtes).toEqual([
      {
        attendu: 'Développer le compostage partagé dans les quartiers',
        obtenu: '1.1 Développer le compostage partagé',
      },
    ]);
    expect(detail.numerosPerdus).toEqual([
      {
        titre: 'Lutter contre le gaspillage alimentaire',
        attendu: '1.2',
        obtenu: '',
      },
    ]);
    expect(detail.malRangees).toEqual([
      {
        titre: '2.1 Ouvrir une ressourcerie intercommunale',
        attendu: AXE_2,
        obtenu: AXE_1,
      },
    ]);
    expect(detail.enTrop).toEqual(['Pilote : service déchets']);
  });

  it('range sous le bon parent une fiche dont le libellé d’axe est écourté', () => {
    const axeEcourte = '1 Réduire les biodéchets des';
    const { score, detail } = scoreSegmentation(
      [
        fiche('1.2 Lutter contre le gaspillage alimentaire', [
          '1 Réduire les biodéchets des ménages',
        ]),
        fiche('2.1 Ouvrir une ressourcerie intercommunale', [axeEcourte]),
      ],
      {
        ...reference,
        axes: ['1 Réduire les biodéchets des ménages', AXE_2],
        actions: [
          {
            axe: '1 Réduire les biodéchets des ménages',
            numero: '1.2',
            titre: 'Lutter contre le gaspillage alimentaire',
          },
        ],
      },
      'fiche'
    );
    expect(score).toMatchObject({
      bonChemin: 1,
      axesTrouves: 1,
      axesComplets: 1,
    });
    expect(detail.axesManquants).toEqual([AXE_2]);
  });

  it('lu à l’étape, attend les étapes sous leur fiche et les fiches sans étape', () => {
    const fiche11 = '1.1 Développer le compostage partagé dans les quartiers';
    const { score, detail } = scoreSegmentation(
      [
        fiche('1 Recenser les sites disponibles', [AXE_1, fiche11]),
        fiche('2 Former les guides composteurs', [AXE_1, fiche11]),
        fiche('1.2 Lutter contre le gaspillage alimentaire', [AXE_1]),
      ],
      reference,
      'etape'
    );
    expect(score).toMatchObject({
      attendues: 4,
      trouvees: 3,
      numeros: 3,
      bonChemin: 3,
    });
    expect(detail.manquantes).toEqual([
      '2.1 Ouvrir une ressourcerie intercommunale',
    ]);
    expect(detail.axesManquants).toEqual([AXE_2]);
  });

  it('ne compte qu’une fois une fiche fenêtrée, et préfère l’homonyme bien rangé', () => {
    const homonymes: ManualReference = {
      ...reference,
      actions: [
        { axe: AXE_1, numero: '1.1', titre: 'Sensibiliser les habitants' },
        { axe: AXE_2, numero: '2.1', titre: 'Sensibiliser les habitants' },
      ],
    };
    const { score } = scoreSegmentation(
      [
        fiche('2.1 Sensibiliser les habitants', [AXE_2]),
        fiche('2.1 Sensibiliser les habitants', [AXE_2], { continued: true }),
        fiche('1.1 Sensibiliser les habitants', [AXE_1]),
      ],
      homonymes,
      'fiche'
    );
    expect(score).toMatchObject({ trouvees: 2, bonChemin: 2, enTrop: 0 });
  });
});
