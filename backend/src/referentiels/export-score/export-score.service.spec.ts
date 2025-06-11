import { PersonneTagOrUser, Tag } from '@/backend/collectivites/index-domain';
import ListFichesService from '@/backend/plans/fiches/list-fiches/list-fiches.service';
import { Test } from '@nestjs/testing';
import ScoresService from '../compute-score/scores.service';
import { GetReferentielService } from '../get-referentiel/get-referentiel.service';
import { HandleMesurePilotesService } from '../handle-mesure-pilotes/handle-mesure-pilotes.service';
import { HandleMesureServicesService } from '../handle-mesure-services/handle-mesure-services.service';
import { deeperReferentielScoring } from '../models/samples/deeper-referentiel-scoring.sample';
import { simpleReferentielScoring } from '../models/samples/simple-referentiel-scoring.sample';
import { SnapshotsService } from '../snapshots/snapshots.service';
import { ExportScoreService } from './export-score.service';

describe('ExportReferentielScoreService', () => {
  let exportReferentielScoreService: ExportScoreService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ExportScoreService],
    })
      .useMocker((token) => {
        if (
          token === GetReferentielService ||
          token === ScoresService ||
          token === SnapshotsService ||
          token === HandleMesurePilotesService ||
          token === HandleMesureServicesService ||
          token === ListFichesService
        ) {
          return {};
        }
      })
      .compile();

    exportReferentielScoreService = moduleRef.get(ExportScoreService);
  });

  it(`getActionScoreRowValues for simple referentiel`, () => {
    const pilotes: Record<string, PersonneTagOrUser[]> = {};
    const services: Record<string, Tag[]> = {};

    pilotes['eci_1.1'] = [
      {
        userId: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
        nom: 'Yolo Dodo',
      },
      {
        tagId: 1,
        nom: 'Lou Piote',
      },
    ];

    services['eci_1.1'] = [
      {
        id: 1,
        nom: 'Super Service',
        collectiviteId: 1,
      },
      {
        id: 2,
        nom: 'Ultra Service',
        collectiviteId: 1,
      },
    ];

    const dataRows = exportReferentielScoreService.getActionScoreRowValues(
      simpleReferentielScoring,
      undefined,
      {}, // descriptions vides pour le test
      pilotes,
      services,
      {} // fiches actions liées vides pour le test
    );
    const dataRowValues = dataRows.map((r) => r.values);

    expect(dataRowValues).toEqual([
      [
        '1',
        "Définition d'une stratégie globale de la politique économie circulaire et inscription dans le territoire",
        '', // description
        '',
        '',
        '',
        30,
        30,
        10,
        0.333,
        0,
        0,
        '',
        '',
        '',
        '', // fiches actions liées
      ],
      [
        '1.1',
        'Définir une stratégie globale de la politique Economie Circulaire et assurer un portage politique fort',
        '', // description
        '',
        'Yolo Dodo, Lou Piote',
        'Super Service, Ultra Service',
        10,
        10,
        10,
        1,
        0,
        0,
        'Fait',
        '',
        '',
        '', // fiches actions liées
      ],
      [
        '1.2',
        "Développer une démarche transversale avec l'ensemble des politiques de la collectivité",
        '', // description
        '',
        '',
        '',
        20,
        20,
        0,
        0,
        0,
        0,
        'Non renseigné',
        '',
        '',
        '', // fiches actions liées
      ],
      [
        '2',
        'Développement des services de réduction, collecte et valorisation des déchets',
        '', // description
        '',
        '',
        '',
        70,
        70,
        0,
        0,
        0,
        0,
        '',
        '',
        '',
        '', // fiches actions liées
      ],
      [
        '2.0',
        'Respecter la réglementation en matière de prévention de déchets',
        '', // description
        '',
        '',
        '',
        0,
        0,
        0,
        0,
        0,
        0,
        'Non renseigné',
        '',
        '',
        '', // fiches actions liées
      ],
      [
        '2.1',
        'Mettre en œuvre les actions du PLPDMA',
        '', // description
        'Mise en œuvre',
        '',
        '',
        65,
        65,
        0,
        0,
        0,
        0,
        'Non renseigné',
        'Explication de mise en œuvre',
        `preuve1.pdf
https://example.com/preuve2.pdf`,
        '', // fiches actions liées
      ],
      [
        '2.2',
        "Disposer d'une commission consultative d'élaboration et de suivi (CCES) élargie",
        '', // description
        '',
        '',
        '',
        5,
        5,
        0,
        0,
        0,
        0,
        'Non renseigné',
        '',
        '',
        '', // fiches actions liées
      ],
      ['Total', '', '', '', '', '', 100, 100, 10, 0.1, 0, 0, '', '', '', ''], // fiches actions liées
    ]);
  });

  it(`getActionScoreRowValues for deeper referentiel`, () => {
    const pilotes: Record<string, PersonneTagOrUser[]> = {};
    const services: Record<string, Tag[]> = {};

    pilotes['eci_1.1'] = [
      {
        userId: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
        nom: 'Yolo Dodo',
      },
      {
        tagId: 1,
        nom: 'Lou Piote',
      },
    ];

    services['eci_1.1'] = [
      {
        id: 1,
        nom: 'Super Service',
        collectiviteId: 1,
      },
      {
        id: 2,
        nom: 'Ultra Service',
        collectiviteId: 1,
      },
    ];

    const dataRows = exportReferentielScoreService.getActionScoreRowValues(
      deeperReferentielScoring,
      undefined,
      {}, // descriptions vides pour le test
      pilotes,
      services,
      {} // fiches actions liées vides pour le test
    );
    const dataRowValues = dataRows.map((r) => r.values);

    expect(dataRowValues).toEqual([
      ['1', 'Action 1', '', '', '', '', 30, 30, 0, 0, 0, 0, '', '', '', ''], // fiches actions liées
      [
        '1.1',
        'Sous-action 1.1',
        '', // description
        'Effets',
        'Yolo Dodo, Lou Piote',
        'Super Service, Ultra Service',
        10,
        10,
        0,
        0,
        0,
        0,
        'Non concerné',
        '',
        '',
        '', // fiches actions liées
      ],
      [
        '1.2',
        'Sous-action 1.2',
        '', // description
        '',
        '',
        '',
        20,
        20,
        0,
        0,
        0,
        0,
        'Non concerné',
        '',
        '',
        '', // fiches actions liées
      ],
      [
        '2',
        'Action 2',
        '',
        '',
        '',
        '',
        70,
        70,
        65,
        0.929,
        0,
        0,
        '',
        '',
        '',
        '',
      ], // fiches actions liées
      [
        '2.0',
        'Sous-action 2.0',
        '', // description
        '',
        '',
        '',
        0,
        0,
        0,
        0,
        0,
        0,
        'Non renseigné',
        '',
        '',
        '', // fiches actions liées
      ],
      [
        '2.1',
        'Sous-action 2.1',
        '', // description
        'Mise en œuvre',
        '',
        '',
        65,
        65,
        65,
        1,
        0,
        0,
        'Fait',
        '',
        '',
        '', // fiches actions liées
      ],
      [
        '2.1.0',
        'Tache 2.1.0',
        '',
        '',
        '',
        '',
        0,
        0,
        0,
        0,
        0,
        0,
        '',
        '',
        '',
        '',
      ], // fiches actions liées
      [
        '2.1.1',
        'Tache 2.1.1',
        '', // description
        '',
        '',
        '',
        40,
        40,
        32,
        0.8,
        8,
        0.2,
        'Détaillé',
        '',
        '',
        '', // fiches actions liées
      ],
      [
        '2.1.2',
        'Tache 2.1.2',
        '',
        '',
        '',
        '',
        25,
        25,
        0,
        0,
        0,
        0,
        '',
        '',
        '',
        '',
      ], // fiches actions liées
      [
        '2.2',
        'Sous-action 2.2',
        '', // description
        'Bases',
        '',
        '',
        5,
        5,
        0,
        0,
        0,
        0,
        'Détaillé',
        '',
        '',
        '', // fiches actions liées
      ],
      [
        '2.2.1',
        'Tache 2.2.1',
        '',
        '',
        '',
        '',
        2,
        2,
        0,
        0,
        0,
        0,
        '',
        '',
        '',
        '',
      ], // fiches actions liées
      [
        '2.2.2',
        'Tache 2.2.2',
        '', // description
        '',
        '',
        '',
        1.5,
        1.5,
        0,
        0,
        0,
        0,
        'Pas fait',
        '',
        '',
        '', // fiches actions liées
      ],
      [
        '2.2.3',
        'Tache 2.2.3',
        '',
        '',
        '',
        '',
        1.5,
        1.5,
        0,
        0,
        0,
        0,
        '',
        '',
        '',
        '', // fiches actions liées
      ],
      ['Total', '', '', '', '', '', 100, 100, 65, 0.65, 0, 0, '', '', '', ''], // fiches actions liées
    ]);
  });

  it(`getActionScoreRowValues uses provided descriptions`, () => {
    const pilotes: Record<string, PersonneTagOrUser[]> = {};
    const services: Record<string, Tag[]> = {};
    const descriptions: Record<string, string> = {
      'eci_1.1': 'Description personnalisée pour eci_1.1',
      'eci_2.1': 'Description détaillée pour eci_2.1',
    };

    const dataRows = exportReferentielScoreService.getActionScoreRowValues(
      simpleReferentielScoring,
      undefined,
      descriptions,
      pilotes,
      services,
      {} // fiches actions liées vides pour ce test
    );

    const mesure11Row = dataRows.find(
      (row) => row.actionScore.identifiant === '1.1'
    );
    const mesure21Row = dataRows.find(
      (row) => row.actionScore.identifiant === '2.1'
    );

    expect(mesure11Row?.values[2]).toBe(
      'Description personnalisée pour eci_1.1'
    );
    expect(mesure21Row?.values[2]).toBe('Description détaillée pour eci_2.1');
  });

  it(`getActionScoreRowValues includes fiches actions liées`, () => {
    const pilotes: Record<string, PersonneTagOrUser[]> = {};
    const services: Record<string, Tag[]> = {};
    const descriptions: Record<string, string> = {};
    const fichesActionLiees: Record<string, string> = {
      'eci_1.1': 'Fiche action mobilité\nFiche action énergie',
      'eci_2.1': 'Fiche action déchets',
      'eci_2.2': '', // Test avec chaîne vide
    };

    const dataRows = exportReferentielScoreService.getActionScoreRowValues(
      simpleReferentielScoring,
      undefined,
      descriptions,
      pilotes,
      services,
      fichesActionLiees
    );

    const mesure11Row = dataRows.find(
      (row) => row.actionScore.identifiant === '1.1'
    );
    const mesure21Row = dataRows.find(
      (row) => row.actionScore.identifiant === '2.1'
    );
    const mesure22Row = dataRows.find(
      (row) => row.actionScore.identifiant === '2.2'
    );

    expect(mesure11Row?.values[15]).toBe(
      'Fiche action mobilité\nFiche action énergie'
    );
    expect(mesure21Row?.values[15]).toBe('Fiche action déchets');
    expect(mesure22Row?.values[15]).toBe(''); // Chaîne vide
  });
});
