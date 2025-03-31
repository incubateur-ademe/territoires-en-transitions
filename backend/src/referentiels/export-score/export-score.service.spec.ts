import { Test } from '@nestjs/testing';
import ScoresService from '../compute-score/scores.service';
import { GetReferentielService } from '../get-referentiel/get-referentiel.service';
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
          token === SnapshotsService
        ) {
          return {};
        }
      })
      .compile();

    exportReferentielScoreService = moduleRef.get(ExportScoreService);
  });

  it(`getActionScoreRowValues for simple referentiel`, () => {
    const dataRows = exportReferentielScoreService.getActionScoreRowValues(
      simpleReferentielScoring,
      undefined
    );
    const dataRowValues = dataRows.map((r) => r.values);

    expect(dataRowValues).toEqual([
      [
        '1',
        "Définition d'une stratégie globale de la politique économie circulaire et inscription dans le territoire",
        '',
        30,
        30,
        10,
        0.33,
        0,
        0,
        '',
        '',
        '',
      ],
      [
        '1.1',
        'Définir une stratégie globale de la politique Economie Circulaire et assurer un portage politique fort',
        '',
        10,
        10,
        10,
        1,
        0,
        0,
        'Fait',
        '',
        '',
      ],
      [
        '1.2',
        "Développer une démarche transversale avec l'ensemble des politiques de la collectivité",
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
      ],
      [
        '2',
        'Développement des services de réduction, collecte et valorisation des déchets',
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
      ],
      [
        '2.0',
        'Respecter la réglementation en matière de prévention de déchets',
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
      ],
      [
        '2.1',
        'Mettre en œuvre les actions du PLPDMA',
        'Mise en œuvre',
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
      ],
      [
        '2.2',
        "Disposer d'une commission consultative d'élaboration et de suivi (CCES) élargie",
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
      ],
      ['Total', '', '', 100, 100, 10, 0.1, 0, 0, '', '', ''],
    ]);
  });

  it(`getActionScoreRowValues for deeper referentiel`, () => {
    const dataRows = exportReferentielScoreService.getActionScoreRowValues(
      deeperReferentielScoring,
      undefined
    );
    const dataRowValues = dataRows.map((r) => r.values);

    expect(dataRowValues).toEqual([
      ['1', 'Action 1', '', 30, 30, 0, 0, 0, 0, '', '', ''],
      [
        '1.1',
        'Sous-action 1.1',
        'Effets',
        10,
        10,
        0,
        0,
        0,
        0,
        'Non concerné',
        '',
        '',
      ],
      [
        '1.2',
        'Sous-action 1.2',
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
      ],
      ['2', 'Action 2', '', 70, 70, 65, 0.93, 0, 0, '', '', ''],
      ['2.0', 'Sous-action 2.0', '', 0, 0, 0, 0, 0, 0, 'Non renseigné', '', ''],
      [
        '2.1',
        'Sous-action 2.1',
        'Mise en œuvre',
        65,
        65,
        65,
        1,
        0,
        0,
        'Fait',
        '',
        '',
      ],
      ['2.1.0', 'Tache 2.1.0', '', 0, 0, 0, 0, 0, 0, '', '', ''],
      ['2.1.1', 'Tache 2.1.1', '', 40, 40, 32, 0.8, 8, 0.2, 'Détaillé', '', ''],
      ['2.1.2', 'Tache 2.1.2', '', 25, 25, 0, 0, 0, 0, '', '', ''],
      ['2.2', 'Sous-action 2.2', 'Bases', 5, 5, 0, 0, 0, 0, 'Détaillé', '', ''],
      ['2.2.1', 'Tache 2.2.1', '', 2, 2, 0, 0, 0, 0, '', '', ''],
      ['2.2.2', 'Tache 2.2.2', '', 1.5, 1.5, 0, 0, 0, 0, 'Pas fait', '', ''],
      ['2.2.3', 'Tache 2.2.3', '', 1.5, 1.5, 0, 0, 0, 0, '', '', ''],
      ['Total', '', '', 100, 100, 65, 0.65, 0, 0, '', '', ''],
    ]);
  });
});
