import { Test } from '@nestjs/testing';
import DocumentService from '@tet/backend/collectivites/documents/services/document.service';
import { CorrelatedActionWithScore } from '@tet/backend/referentiels/correlated-actions/referentiel-action-origine-with-score.dto';
import { ScoreIndicatifService } from '@tet/backend/referentiels/score-indicatif/score-indicatif.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import {
  CollectiviteTypeEnum,
  IdentiteCollectivite,
  PersonnalisationReponsesPayload,
} from '@tet/domain/collectivites';
import {
  ActionDefinitionEssential,
  ActionScoreWithOnlyPoints,
  ActionTreeNode,
  ActionTypeEnum,
  ScoreFields,
} from '@tet/domain/referentiels';
import { roundTo } from '@tet/domain/utils';
import { PersonnalisationConsequencesByActionId } from '../../collectivites/personnalisations/models/personnalisation-consequence.dto';
import { caePersonnalisationRegles } from '../../collectivites/personnalisations/models/samples/cae-personnalisation-regles.sample';
import PersonnalisationsExpressionService from '../../collectivites/personnalisations/services/personnalisations-expression.service';
import PersonnalisationsService from '../../collectivites/personnalisations/services/personnalisations-service';
import CollectivitesService from '../../collectivites/services/collectivites.service';
import ConfigurationService from '../../utils/config/configuration.service';
import { DatabaseService } from '../../utils/database/database.service';
import SheetService from '../../utils/google-sheets/sheet.service';
import MattermostNotificationService from '../../utils/mattermost-notification.service';
import { CorrelatedActionsWithScoreFields } from '../correlated-actions/correlated-actions.dto';
import { GetReferentielDefinitionService } from '../definitions/get-referentiel-definition/get-referentiel-definition.service';
import { GetReferentielService } from '../get-referentiel/get-referentiel.service';
import { LabellisationService } from '../labellisations/labellisation.service';
import { caeReferentiel } from '../models/samples/cae-referentiel';
import { deeperReferentiel } from '../models/samples/deeper-referentiel';
import { eciReferentiel } from '../models/samples/eci-referentiel';
import { simpleReferentiel } from '../models/samples/simple-referentiel';
import { SnapshotsService } from '../snapshots/snapshots.service';
import { ActionStatutsByActionId } from './action-statuts-by-action-id.dto';
import ScoresService from './scores.service';

describe('ReferentielsScoringService', () => {
  let referentielsScoringService: ScoresService;
  let personnalisationService: PersonnalisationsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ScoresService,
        SnapshotsService,
        PersonnalisationsService,
        PersonnalisationsExpressionService,
        GetReferentielService,
        GetReferentielDefinitionService,
      ],
    })
      .useMocker((token) => {
        if (
          token === DatabaseService ||
          token === PermissionService ||
          token === CollectivitesService ||
          token === LabellisationService ||
          token === MattermostNotificationService ||
          token === ConfigurationService ||
          token === SheetService ||
          token === DocumentService ||
          token === ScoreIndicatifService
        ) {
          return {};
        }
      })
      .compile();

    referentielsScoringService = moduleRef.get(ScoresService);
    personnalisationService = moduleRef.get(PersonnalisationsService);
  });

  describe('getScoreFromOrigineActionsAndRatio', () => {
    it('Standard test avec ponderation', async () => {
      const origineActions: CorrelatedActionWithScore[] = [
        {
          referentielId: 'cae',
          actionId: 'cae_1.1.2.2.3',
          ponderation: 1,
          nom: null,
          score: {
            pointPotentiel: 0.8,
            pointFait: 0.8,
            pointProgramme: 0,
            pointPasFait: 0,
            pointNonRenseigne: 0,
            pointReferentiel: 0.8,
            totalTachesCount: 1,
            faitTachesAvancement: 1,
            programmeTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
          },
        },
        {
          referentielId: 'cae',
          actionId: 'cae_1.1.2.2.5',
          ponderation: 1,
          nom: null,
          score: {
            pointPotentiel: 0.8,
            pointFait: 0.8,
            pointProgramme: 0,
            pointPasFait: 0,
            pointNonRenseigne: 0,
            pointReferentiel: 0.8,
            totalTachesCount: 1,
            faitTachesAvancement: 1,
            programmeTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
          },
        },
        {
          referentielId: 'cae',
          actionId: 'cae_1.1.2.2.1',
          ponderation: 1,
          nom: null,
          score: {
            pointPotentiel: 0.8,
            pointFait: 0.8,
            pointProgramme: 0,
            pointPasFait: 0,
            pointNonRenseigne: 0,
            pointReferentiel: 0.8,
            totalTachesCount: 1,
            faitTachesAvancement: 1,
            programmeTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
          },
        },
        {
          referentielId: 'cae',
          actionId: 'cae_1.1.2.2.2',
          ponderation: 0.5,
          nom: null,
          score: {
            pointPotentiel: 0.8,
            pointFait: 0,
            pointProgramme: 0,
            pointPasFait: 0,
            pointNonRenseigne: 0.8,
            pointReferentiel: 0.8,
            totalTachesCount: 1,
            faitTachesAvancement: 0,
            programmeTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
          },
        },
      ];

      const referentielPointsPotentiels = 3;

      const ratio = referentielsScoringService.getRatioFromOrigineActions(
        origineActions,
        referentielPointsPotentiels
      );
      expect(ratio).toEqual(3 / (0.8 + 0.8 + 0.8 + 0.8 * 0.5));

      const score =
        referentielsScoringService.getScoreFromOrigineActionsAndRatio(
          ratio,
          origineActions,
          3,
          referentielPointsPotentiels
        );
      expect(score).toEqual({
        pointFait: 2.571,
        pointNonRenseigne: 0.429,
        pointPasFait: 0,
        pointProgramme: 0,
      });
    });

    it("La réduction de potentiel des actions d'origine doit être ignorée, on ne considère que l'avancement", async () => {
      const origineActions: CorrelatedActionWithScore[] = [
        {
          referentielId: 'cae',
          actionId: 'cae_3.1.1.1',
          ponderation: 1,
          nom: null,
          score: {
            pointPotentiel: 0.4,
            pointFait: 0.4,
            pointProgramme: 0,
            pointPasFait: 0,
            pointNonRenseigne: 0,
            pointReferentiel: 2,
            totalTachesCount: 4,
            faitTachesAvancement: 4,
            programmeTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            pasConcerneTachesAvancement: 0,
          },
        },
      ];

      const referentielPointsPotentiels = 1.2;

      const ratio = referentielsScoringService.getRatioFromOrigineActions(
        origineActions,
        referentielPointsPotentiels
      );
      expect(ratio).toEqual(1.2 / 2);

      const score =
        referentielsScoringService.getScoreFromOrigineActionsAndRatio(
          ratio,
          origineActions,
          3,
          referentielPointsPotentiels
        );
      expect(score).toEqual({
        pointFait: 1.2,
        pointNonRenseigne: 0,
        pointPasFait: 0,
        pointProgramme: 0,
      });
    });
  });

  describe('updateFromOrigineActions', () => {
    it('Standard test without change in total points in new referentiel', async () => {
      const referentielActionsWithScore: ActionTreeNode<
        ActionDefinitionEssential &
          ScoreFields &
          CorrelatedActionsWithScoreFields & { [key: string]: unknown }
      > = {
        actionId: 'te_1.3.1.3',
        nom: 'Mettre la politique d’urbanisme en cohérence avec les objectifs de transition écologique',
        points: 5,
        pourcentage: 21.760391198044008,
        actionsEnfant: [],
        level: 4,
        actionType: ActionTypeEnum.SOUS_ACTION,
        actionsOrigine: [
          {
            referentielId: 'cae',
            actionId: 'cae_1.3.1.3',
            ponderation: 1,
            nom: 'Mettre la politique d’urbanisme et les objectifs de développement en cohérence avec la politique climat-air-énergie',
            score: {
              pointReferentiel: 3,
              pointPotentiel: 3,
              pointFait: 2,
              pointPasFait: 0,
              pointNonRenseigne: 1,
              pointProgramme: 0,
              faitTachesAvancement: 2,
              programmeTachesAvancement: 0,
              pasFaitTachesAvancement: 0,
              pasConcerneTachesAvancement: 0,
              totalTachesCount: 3,
            },
          },
          {
            referentielId: 'cae',
            actionId: 'cae_6.3.1.3.2',
            ponderation: 0.5,
            nom: "Décliner des orientations stratégiques fortes en matière de localisation et de qualité environnementale des zones d'activités dans les documents d’urbanisme",
            score: {
              pointReferentiel: 4,
              pointPotentiel: 4,
              pointFait: 3,
              pointPasFait: 0,
              pointNonRenseigne: 1,
              pointProgramme: 0,
              faitTachesAvancement: 0.75,
              programmeTachesAvancement: 0,
              pasFaitTachesAvancement: 0,
              pasConcerneTachesAvancement: 0,
              totalTachesCount: 1,
            },
          },
        ],
        referentielsOrigine: ['cae'],
        score: {
          actionId: 'te_1.3.1.3',
          pointReferentiel: 5,
          pointPotentiel: null,
          pointPotentielPerso: null,
          pointFait: null,
          pointPasFait: null,
          pointNonRenseigne: null,
          pointProgramme: null,
          concerne: true,
          completedTachesCount: null,
          totalTachesCount: 1,
          faitTachesAvancement: null,
          programmeTachesAvancement: null,
          pasFaitTachesAvancement: null,
          pasConcerneTachesAvancement: null,
          desactive: false,
          renseigne: true,
        },
        scoresTag: {},
      };

      referentielsScoringService.updateFromOrigineActions(
        referentielActionsWithScore
      );

      expect(referentielActionsWithScore.score).toEqual({
        actionId: 'te_1.3.1.3',
        completedTachesCount: null,
        concerne: true,
        desactive: false,
        faitTachesAvancement: null,
        pasConcerneTachesAvancement: null,
        pasFaitTachesAvancement: null,
        pointFait: 3.5,
        pointNonRenseigne: 1.5,
        pointPasFait: 0,
        pointPotentiel: null,
        pointPotentielPerso: null,
        pointProgramme: 0,
        pointReferentiel: 5,
        programmeTachesAvancement: null,
        renseigne: true,
        totalTachesCount: 1,
      });

      const expectedCaePoints: ActionScoreWithOnlyPoints = {
        pointFait: 3.5,
        pointNonRenseigne: 1.5,
        pointPasFait: 0,
        pointProgramme: 0,
        pointReferentiel: 5,
        pointPotentiel: 5,
      };
      expect(referentielActionsWithScore.scoresTag['cae']).toEqual(
        expectedCaePoints
      );

      // Not normalized
      const expectedCaePointsOrigine: ActionScoreWithOnlyPoints = {
        pointFait: 5,
        pointNonRenseigne: 2,
        pointPasFait: 0,
        pointProgramme: 0,
        pointReferentiel: 7,
        pointPotentiel: 7,
      };
      expect(referentielActionsWithScore.scoresOrigine?.['cae']).toEqual(
        expectedCaePointsOrigine
      );
    });

    it('Standard test with change in total points in new referentiel', async () => {
      // 3 pts + 4 pts * 0.5 = 5 pts in total but we have 4 pts in the new referentiel

      const referectielActionWithScore: ActionTreeNode<
        ActionDefinitionEssential &
          ScoreFields &
          CorrelatedActionsWithScoreFields & { [key: string]: unknown }
      > = {
        actionId: 'te_1.3.1.3',
        nom: 'Mettre la politique d’urbanisme en cohérence avec les objectifs de transition écologique',
        points: 4,
        pourcentage: 21.760391198044008,
        actionsEnfant: [],
        level: 4,
        actionType: ActionTypeEnum.SOUS_ACTION,
        actionsOrigine: [
          {
            referentielId: 'cae',
            actionId: 'cae_1.3.1.3',
            ponderation: 1,
            nom: 'Mettre la politique d’urbanisme et les objectifs de développement en cohérence avec la politique climat-air-énergie',
            score: {
              pointReferentiel: 3,
              pointPotentiel: 3,
              pointFait: 2,
              pointPasFait: 0,
              pointNonRenseigne: 1,
              pointProgramme: 0,
              faitTachesAvancement: 2,
              programmeTachesAvancement: 0,
              pasFaitTachesAvancement: 0,
              pasConcerneTachesAvancement: 0,
              totalTachesCount: 3,
            },
          },
          {
            referentielId: 'eci',
            actionId: 'eci_6.3.1.3.2',
            ponderation: 0.5,
            nom: "Décliner des orientations stratégiques fortes en matière de localisation et de qualité environnementale des zones d'activités dans les documents d’urbanisme",
            score: {
              pointReferentiel: 4,
              pointPotentiel: 4,
              pointFait: 3,
              pointPasFait: 0,
              pointNonRenseigne: 1,
              pointProgramme: 0,
              faitTachesAvancement: 0.75,
              programmeTachesAvancement: 0,
              pasFaitTachesAvancement: 0,
              pasConcerneTachesAvancement: 0,
              totalTachesCount: 1,
            },
          },
        ],
        referentielsOrigine: ['cae', 'eci'],
        score: {
          actionId: 'te_1.3.1.3',
          pointReferentiel: 4,
          pointPotentiel: null,
          pointPotentielPerso: null,
          pointFait: null,
          pointPasFait: null,
          pointNonRenseigne: null,
          pointProgramme: null,
          concerne: true,
          completedTachesCount: null,
          totalTachesCount: 1,
          faitTachesAvancement: null,
          programmeTachesAvancement: null,
          pasFaitTachesAvancement: null,
          pasConcerneTachesAvancement: null,
          desactive: false,
          renseigne: true,
        },
        scoresTag: {},
      };
      referentielsScoringService.updateFromOrigineActions(
        referectielActionWithScore
      );
      expect(referectielActionWithScore.score).toEqual({
        actionId: 'te_1.3.1.3',
        completedTachesCount: null,
        concerne: true,
        desactive: false,
        faitTachesAvancement: null,
        pasConcerneTachesAvancement: null,
        pasFaitTachesAvancement: null,
        pointFait: 2.8,
        pointNonRenseigne: 1.2,
        pointPasFait: 0,
        pointPotentiel: null,
        pointPotentielPerso: null,
        pointProgramme: 0,
        pointReferentiel: 4,
        programmeTachesAvancement: null,
        renseigne: true,
        totalTachesCount: 1,
      });

      const expectedCaePoints: ActionScoreWithOnlyPoints = {
        pointFait: 1.6,
        pointNonRenseigne: 0.8,
        pointPasFait: 0,
        pointProgramme: 0,
        pointReferentiel: 2.4,
        pointPotentiel: 2.4,
      };
      expect(referectielActionWithScore.scoresTag['cae']).toEqual(
        expectedCaePoints
      );
      const expectedEciPoints: ActionScoreWithOnlyPoints = {
        pointFait: 1.2,
        pointNonRenseigne: 0.4,
        pointPasFait: 0,
        pointProgramme: 0,
        pointReferentiel: 1.6,
        pointPotentiel: 1.6,
      };
      expect(referectielActionWithScore.scoresTag['eci']).toEqual(
        expectedEciPoints
      );

      // Not normalized
      const expectedCaePointsOrigine: ActionScoreWithOnlyPoints = {
        pointFait: 2,
        pointNonRenseigne: 1,
        pointPasFait: 0,
        pointProgramme: 0,
        pointReferentiel: 3,
        pointPotentiel: 3,
      };
      expect(referectielActionWithScore.scoresOrigine?.['cae']).toEqual(
        expectedCaePointsOrigine
      );

      const expectedEciPointsOrigine: ActionScoreWithOnlyPoints = {
        pointFait: 3,
        pointNonRenseigne: 1,
        pointPasFait: 0,
        pointProgramme: 0,
        pointReferentiel: 4,
        pointPotentiel: 4,
      };
      expect(referectielActionWithScore.scoresOrigine?.['eci']).toEqual(
        expectedEciPointsOrigine
      );
    });

    test('Test for disabled action', async () => {
      const referectielActionWithScore: ActionTreeNode<
        ActionDefinitionEssential &
          ScoreFields &
          CorrelatedActionsWithScoreFields & { [key: string]: unknown }
      > = {
        actionId: 'te_1.1.1.0',
        identifiant: '1.1.1.0',
        nom: 'Participer au Diagnostic Climat-Air-Energie du territoire',
        points: 3,
        categorie: null,
        pourcentage: 33.33333333333333,
        tags: ['cae', 'te_cae'],
        actionsEnfant: [],
        level: 4,
        actionType: ActionTypeEnum.SOUS_ACTION,
        actionsOrigine: [
          {
            referentielId: 'cae',
            actionId: 'cae_1.1.2.2.3',
            ponderation: 1,
            nom: null,
            score: {
              pointPotentiel: 0.8,
              pointFait: 0.8,
              pointProgramme: 0,
              pointPasFait: 0,
              pointNonRenseigne: 0,
              pointReferentiel: 0.8,
              totalTachesCount: 1,
              faitTachesAvancement: 1,
              programmeTachesAvancement: 0,
              pasFaitTachesAvancement: 0,
              pasConcerneTachesAvancement: 0,
            },
          },
          {
            referentielId: 'cae',
            actionId: 'cae_1.1.2.2.5',
            ponderation: 1,
            nom: null,
            score: {
              pointPotentiel: 0.8,
              pointFait: 0.8,
              pointProgramme: 0,
              pointPasFait: 0,
              pointNonRenseigne: 0,
              pointReferentiel: 0.8,
              totalTachesCount: 1,
              faitTachesAvancement: 1,
              programmeTachesAvancement: 0,
              pasFaitTachesAvancement: 0,
              pasConcerneTachesAvancement: 0,
            },
          },
          {
            referentielId: 'cae',
            actionId: 'cae_1.1.2.2.1',
            ponderation: 1,
            nom: null,
            score: {
              pointPotentiel: 0.8,
              pointFait: 0.8,
              pointProgramme: 0,
              pointPasFait: 0,
              pointNonRenseigne: 0,
              pointReferentiel: 0.8,
              totalTachesCount: 1,
              faitTachesAvancement: 1,
              programmeTachesAvancement: 0,
              pasFaitTachesAvancement: 0,
              pasConcerneTachesAvancement: 0,
            },
          },
          {
            referentielId: 'cae',
            actionId: 'cae_1.1.2.2.2',
            ponderation: 1,
            nom: null,
            score: {
              pointPotentiel: 0.8,
              pointFait: 0.8,
              pointProgramme: 0,
              pointPasFait: 0,
              pointNonRenseigne: 0,
              pointReferentiel: 0.8,
              totalTachesCount: 1,
              faitTachesAvancement: 1,
              programmeTachesAvancement: 0,
              pasFaitTachesAvancement: 0,
              pasConcerneTachesAvancement: 0,
            },
          },
        ],
        referentielsOrigine: ['cae'],
        score: {
          actionId: 'te_1.1.1.0',
          pointReferentiel: 3,
          pointPotentiel: 0,
          pointPotentielPerso: null,
          pointFait: null,
          pointPasFait: null,
          pointNonRenseigne: null,
          pointProgramme: null,
          concerne: false,
          completedTachesCount: null,
          totalTachesCount: 1,
          faitTachesAvancement: null,
          programmeTachesAvancement: null,
          pasFaitTachesAvancement: null,
          pasConcerneTachesAvancement: null,
          desactive: true,
          renseigne: true,
        },
        scoresTag: {},
      };

      referentielsScoringService.updateFromOrigineActions(
        referectielActionWithScore
      );
      expect(referectielActionWithScore.score).toEqual({
        actionId: 'te_1.1.1.0',
        completedTachesCount: null,
        concerne: false,
        desactive: true,
        faitTachesAvancement: null,
        pasConcerneTachesAvancement: null,
        pasFaitTachesAvancement: null,
        pointFait: 0,
        pointNonRenseigne: 0,
        pointPasFait: 0,
        pointPotentiel: 0,
        pointPotentielPerso: null,
        pointProgramme: 0,
        pointReferentiel: 3,
        programmeTachesAvancement: null,
        renseigne: true,
        totalTachesCount: 1,
      });

      const expectedCaePoints: ActionScoreWithOnlyPoints = {
        pointFait: 0,
        pointNonRenseigne: 0,
        pointPasFait: 0,
        pointProgramme: 0,
        pointReferentiel: 0,
        pointPotentiel: 0,
      };
      expect(referectielActionWithScore.scoresTag['cae']).toEqual(
        expectedCaePoints
      );

      // Not normalized
      const expectedCaePointsOrigine: ActionScoreWithOnlyPoints = {
        pointFait: 3.2,
        pointNonRenseigne: 0,
        pointPasFait: 0,
        pointProgramme: 0,
        pointReferentiel: 3.2,
        pointPotentiel: 3.2,
      };
      expect(referectielActionWithScore.scoresOrigine?.['cae']).toEqual(
        expectedCaePointsOrigine
      );
    });
  });

  describe('computeScoreMap', () => {
    it('notation_when_one_tache_is_fait', async () => {
      const personnalisationConsequences: PersonnalisationConsequencesByActionId =
        {};
      const actionStatuts: ActionStatutsByActionId = {
        'eci_1.1': {
          concerne: true,
          avancement: 'fait',
          avancementDetaille: [1, 0, 0],
        },
      };

      const scoresMap = referentielsScoringService.computeScoreMap(
        simpleReferentiel,
        personnalisationConsequences,
        actionStatuts,
        1
      );

      const scoreLength = Object.keys(scoresMap).length;
      expect(scoreLength).toEqual(8);

      expect(scoresMap['eci_1.1']).toEqual({
        aStatut: true,
        avancement: 'fait',
        actionId: 'eci_1.1',
        pointFait: 10,
        pointProgramme: 0.0,
        pointPasFait: 0.0,
        pointNonRenseigne: 0.0,
        pointPotentiel: 10,
        pointReferentiel: 10,
        concerne: true,
        totalTachesCount: 1,
        completedTachesCount: 1,
        faitTachesAvancement: 1,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: true,
      });

      expect(scoresMap['eci_1']).toEqual({
        actionId: 'eci_1',
        pointFait: 10,
        pointProgramme: 0.0,
        pointPasFait: 0.0,
        pointNonRenseigne: 20,
        pointPotentiel: 30,
        pointReferentiel: 30,
        concerne: true,
        totalTachesCount: 2,
        completedTachesCount: 1,
        faitTachesAvancement: 1,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: false,
      });

      expect(scoresMap['eci_2']).toEqual({
        actionId: 'eci_2',
        pointFait: 0,
        pointProgramme: 0.0,
        pointPasFait: 0.0,
        pointNonRenseigne: 70,
        pointPotentiel: 70,
        pointReferentiel: 70,
        concerne: true,
        totalTachesCount: 3,
        completedTachesCount: 0,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: false,
      });

      expect(scoresMap['eci']).toEqual({
        actionId: 'eci',
        pointFait: 10,
        pointProgramme: 0.0,
        pointPasFait: 0.0,
        pointNonRenseigne: 90,
        pointPotentiel: 100,
        pointReferentiel: 100,
        concerne: true,
        totalTachesCount: 5,
        completedTachesCount: 1,
        faitTachesAvancement: 1,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: false,
      });
    });

    it('notation_when_one_tache_is_fait_avancementDetaille_non_renseigne', async () => {
      const personnalisationConsequences: PersonnalisationConsequencesByActionId =
        {};
      const actionStatuts: ActionStatutsByActionId = {
        'eci_1.1': {
          concerne: true,
          avancement: 'fait',
          avancementDetaille: null,
        },
      };

      const scoresMap = referentielsScoringService.computeScoreMap(
        simpleReferentiel,
        personnalisationConsequences,
        actionStatuts,
        1
      );

      const scoreLength = Object.keys(scoresMap).length;
      expect(scoreLength).toEqual(8);

      expect(scoresMap['eci_1.1']).toEqual({
        aStatut: true,
        avancement: 'fait',
        actionId: 'eci_1.1',
        pointFait: 10,
        pointProgramme: 0.0,
        pointPasFait: 0.0,
        pointNonRenseigne: 0.0,
        pointPotentiel: 10,
        pointReferentiel: 10,
        concerne: true,
        totalTachesCount: 1,
        completedTachesCount: 1,
        faitTachesAvancement: 1,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: true,
      });

      expect(scoresMap['eci_1']).toEqual({
        actionId: 'eci_1',
        pointFait: 10,
        pointProgramme: 0.0,
        pointPasFait: 0.0,
        pointNonRenseigne: 20,
        pointPotentiel: 30,
        pointReferentiel: 30,
        concerne: true,
        totalTachesCount: 2,
        completedTachesCount: 1,
        faitTachesAvancement: 1,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: false,
      });

      expect(scoresMap['eci_2']).toEqual({
        actionId: 'eci_2',
        pointFait: 0,
        pointProgramme: 0.0,
        pointPasFait: 0.0,
        pointNonRenseigne: 70,
        pointPotentiel: 70,
        pointReferentiel: 70,
        concerne: true,
        totalTachesCount: 3,
        completedTachesCount: 0,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: false,
      });

      expect(scoresMap['eci']).toEqual({
        actionId: 'eci',
        pointFait: 10,
        pointProgramme: 0.0,
        pointPasFait: 0.0,
        pointNonRenseigne: 90,
        pointPotentiel: 100,
        pointReferentiel: 100,
        concerne: true,
        totalTachesCount: 5,
        completedTachesCount: 1,
        faitTachesAvancement: 1,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: false,
      });
    });

    it('notation_when_one_tache_is_programme', async () => {
      const personnalisationConsequences: PersonnalisationConsequencesByActionId =
        {};
      const actionStatuts: ActionStatutsByActionId = {
        'eci_1.1': {
          concerne: true,
          avancement: 'programme',
          avancementDetaille: [0, 1, 0],
        },
      };

      const scoresMap = referentielsScoringService.computeScoreMap(
        simpleReferentiel,
        personnalisationConsequences,
        actionStatuts,
        1
      );

      const scoreLength = Object.keys(scoresMap).length;
      expect(scoreLength).toEqual(8);

      expect(scoresMap['eci_1.1']).toEqual({
        aStatut: true,
        avancement: 'programme',
        actionId: 'eci_1.1',
        pointFait: 0,
        pointProgramme: 10,
        pointPasFait: 0.0,
        pointNonRenseigne: 0.0,
        pointPotentiel: 10,
        pointReferentiel: 10,
        concerne: true,
        totalTachesCount: 1,
        completedTachesCount: 1,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 1,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: true,
      });

      expect(scoresMap['eci_1']).toEqual({
        actionId: 'eci_1',
        pointFait: 0,
        pointProgramme: 10,
        pointPasFait: 0.0,
        pointNonRenseigne: 20,
        pointPotentiel: 30,
        pointReferentiel: 30,
        concerne: true,
        totalTachesCount: 2,
        completedTachesCount: 1,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 1,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: false,
      });

      expect(scoresMap['eci_2']).toEqual({
        actionId: 'eci_2',
        pointFait: 0,
        pointProgramme: 0.0,
        pointPasFait: 0.0,
        pointNonRenseigne: 70,
        pointPotentiel: 70,
        pointReferentiel: 70,
        concerne: true,
        totalTachesCount: 3,
        completedTachesCount: 0,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: false,
      });

      expect(scoresMap['eci']).toEqual({
        actionId: 'eci',
        pointFait: 0,
        pointProgramme: 10,
        pointPasFait: 0.0,
        pointNonRenseigne: 90,
        pointPotentiel: 100,
        pointReferentiel: 100,
        concerne: true,
        totalTachesCount: 5,
        completedTachesCount: 1,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 1,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: false,
      });
    });

    it('notation_when_one_tache_is_pas_fait', async () => {
      const personnalisationConsequences: PersonnalisationConsequencesByActionId =
        {};
      const actionStatuts: ActionStatutsByActionId = {
        'eci_1.1': {
          concerne: true,
          avancement: 'pas_fait',
          avancementDetaille: [0, 0, 1],
        },
      };

      const scoresMap = referentielsScoringService.computeScoreMap(
        simpleReferentiel,
        personnalisationConsequences,
        actionStatuts,
        1
      );

      const scoreLength = Object.keys(scoresMap).length;
      expect(scoreLength).toEqual(8);

      expect(scoresMap['eci_1.1']).toEqual({
        aStatut: true,
        avancement: 'pas_fait',
        actionId: 'eci_1.1',
        pointFait: 0,
        pointProgramme: 0,
        pointPasFait: 10.0,
        pointNonRenseigne: 0.0,
        pointPotentiel: 10,
        pointReferentiel: 10,
        concerne: true,
        totalTachesCount: 1,
        completedTachesCount: 1,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 1,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: true,
      });

      expect(scoresMap['eci_1']).toEqual({
        actionId: 'eci_1',
        pointFait: 0,
        pointProgramme: 0,
        pointPasFait: 10,
        pointNonRenseigne: 20,
        pointPotentiel: 30,
        pointReferentiel: 30,
        concerne: true,
        totalTachesCount: 2,
        completedTachesCount: 1,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 1,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: false,
      });

      expect(scoresMap['eci_2']).toEqual({
        actionId: 'eci_2',
        pointFait: 0,
        pointProgramme: 0.0,
        pointPasFait: 0.0,
        pointNonRenseigne: 70,
        pointPotentiel: 70,
        pointReferentiel: 70,
        concerne: true,
        totalTachesCount: 3,
        completedTachesCount: 0,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: false,
      });

      expect(scoresMap['eci']).toEqual({
        actionId: 'eci',
        pointFait: 0,
        pointProgramme: 0,
        pointPasFait: 10,
        pointNonRenseigne: 90,
        pointPotentiel: 100,
        pointReferentiel: 100,
        concerne: true,
        totalTachesCount: 5,
        completedTachesCount: 1,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 1,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: false,
      });
    });

    it('notation_when_one_tache_has_detailed_avancement', async () => {
      const personnalisationConsequences: PersonnalisationConsequencesByActionId =
        {};
      const actionStatuts: ActionStatutsByActionId = {
        'eci_1.1': {
          concerne: true,
          avancement: 'detaille',
          avancementDetaille: [0.2, 0.7, 0.1],
        },
      };

      const scoresMap = referentielsScoringService.computeScoreMap(
        simpleReferentiel,
        personnalisationConsequences,
        actionStatuts,
        1
      );

      const scoreLength = Object.keys(scoresMap).length;
      expect(scoreLength).toEqual(8);

      expect(scoresMap['eci_1.1']).toEqual({
        aStatut: true,
        avancement: 'detaille',
        actionId: 'eci_1.1',
        pointFait: 2,
        pointProgramme: 7,
        pointPasFait: 1,
        pointNonRenseigne: 0.0,
        pointPotentiel: 10,
        pointReferentiel: 10,
        concerne: true,
        totalTachesCount: 1,
        completedTachesCount: 1,
        faitTachesAvancement: 0.2,
        programmeTachesAvancement: 0.7,
        pasFaitTachesAvancement: 0.1,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: true,
      });

      expect(scoresMap['eci_1']).toEqual({
        actionId: 'eci_1',
        pointFait: 2,
        pointProgramme: 7,
        pointPasFait: 1,
        pointNonRenseigne: 20,
        pointPotentiel: 30,
        pointReferentiel: 30,
        concerne: true,
        totalTachesCount: 2,
        completedTachesCount: 1,
        faitTachesAvancement: 0.2,
        programmeTachesAvancement: 0.7,
        pasFaitTachesAvancement: 0.1,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: false,
      });

      expect(scoresMap['eci_2']).toEqual({
        actionId: 'eci_2',
        pointFait: 0,
        pointProgramme: 0.0,
        pointPasFait: 0.0,
        pointNonRenseigne: 70,
        pointPotentiel: 70,
        pointReferentiel: 70,
        concerne: true,
        totalTachesCount: 3,
        completedTachesCount: 0,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: false,
      });

      expect(scoresMap['eci']).toEqual({
        actionId: 'eci',
        pointFait: 2,
        pointProgramme: 7,
        pointPasFait: 1,
        pointNonRenseigne: 90,
        pointPotentiel: 100,
        pointReferentiel: 100,
        concerne: true,
        totalTachesCount: 5,
        completedTachesCount: 1,
        faitTachesAvancement: 0.2,
        programmeTachesAvancement: 0.7,
        pasFaitTachesAvancement: 0.1,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: false,
      });
    });

    it('notation_when_one_tache_is_non_concerne', async () => {
      const personnalisationConsequences: PersonnalisationConsequencesByActionId =
        {};
      const actionStatuts: ActionStatutsByActionId = {
        'eci_1.1': {
          concerne: false,
          avancement: 'non_renseigne',
          avancementDetaille: null,
        },
      };

      const scoresMap = referentielsScoringService.computeScoreMap(
        simpleReferentiel,
        personnalisationConsequences,
        actionStatuts,
        1
      );

      const scoreLength = Object.keys(scoresMap).length;
      expect(scoreLength).toEqual(8);

      expect(scoresMap['eci_1.1']).toEqual({
        aStatut: true,
        avancement: 'non_renseigne',
        actionId: 'eci_1.1',
        pointFait: 0,
        pointProgramme: 0,
        pointPasFait: 0,
        pointNonRenseigne: 0.0,
        pointPotentiel: 0,
        pointReferentiel: 10,
        concerne: false,
        totalTachesCount: 1,
        completedTachesCount: 1,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 1,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: true,
      });

      // Redistribution des points
      expect(scoresMap['eci_1.2']).toEqual({
        actionId: 'eci_1.2',
        pointFait: 0,
        pointProgramme: 0,
        pointPasFait: 0,
        pointNonRenseigne: 30,
        pointPotentiel: 30,
        pointReferentiel: 20,
        concerne: true,
        totalTachesCount: 1,
        completedTachesCount: 0,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: false,
      });

      expect(scoresMap['eci_1']).toEqual({
        actionId: 'eci_1',
        pointFait: 0,
        pointProgramme: 0,
        pointPasFait: 0,
        pointNonRenseigne: 30,
        pointPotentiel: 30,
        pointReferentiel: 30,
        concerne: true,
        totalTachesCount: 2,
        completedTachesCount: 1,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 1,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: false,
      });

      expect(scoresMap['eci_2']).toEqual({
        actionId: 'eci_2',
        pointFait: 0,
        pointProgramme: 0.0,
        pointPasFait: 0.0,
        pointNonRenseigne: 70,
        pointPotentiel: 70,
        pointReferentiel: 70,
        concerne: true,
        totalTachesCount: 3,
        completedTachesCount: 0,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: false,
      });

      expect(scoresMap['eci']).toEqual({
        actionId: 'eci',
        pointFait: 0,
        pointProgramme: 0,
        pointPasFait: 0,
        pointNonRenseigne: 100,
        pointPotentiel: 100,
        pointReferentiel: 100,
        concerne: true,
        totalTachesCount: 5,
        completedTachesCount: 1,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 1,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: false,
      });
    });

    it('notation_when_an_action_of_action_level_becomes_non_concernee', async () => {
      const personnalisationConsequences: PersonnalisationConsequencesByActionId =
        {};
      const actionStatuts: ActionStatutsByActionId = {
        'eci_1.1': {
          concerne: false,
          avancement: 'non_renseigne',
          avancementDetaille: null,
        },
        'eci_1.2': {
          concerne: false,
          avancement: 'non_renseigne',
          avancementDetaille: null,
        },
      };

      const scoresMap = referentielsScoringService.computeScoreMap(
        simpleReferentiel,
        personnalisationConsequences,
        actionStatuts,
        1
      );

      const scoreLength = Object.keys(scoresMap).length;
      expect(scoreLength).toEqual(8);

      expect(scoresMap['eci_1.1']).toEqual({
        aStatut: true,
        avancement: 'non_renseigne',
        actionId: 'eci_1.1',
        pointFait: 0,
        pointProgramme: 0,
        pointPasFait: 0,
        pointNonRenseigne: 0.0,
        pointPotentiel: 0,
        pointReferentiel: 10,
        concerne: false,
        totalTachesCount: 1,
        completedTachesCount: 1,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 1,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: true,
      });

      expect(scoresMap['eci_1.2']).toEqual({
        aStatut: true,
        avancement: 'non_renseigne',
        actionId: 'eci_1.2',
        pointFait: 0,
        pointProgramme: 0,
        pointPasFait: 0,
        pointNonRenseigne: 0,
        pointPotentiel: 0,
        pointReferentiel: 20,
        concerne: false,
        totalTachesCount: 1,
        completedTachesCount: 1,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 1,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: true,
      });

      expect(scoresMap['eci_1']).toEqual({
        actionId: 'eci_1',
        pointFait: 0,
        pointProgramme: 0,
        pointPasFait: 0,
        pointNonRenseigne: 0,
        pointPotentiel: 0,
        pointReferentiel: 30,
        concerne: false,
        totalTachesCount: 2,
        completedTachesCount: 2,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 2,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: true,
      });

      expect(scoresMap['eci_2']).toEqual({
        actionId: 'eci_2',
        pointFait: 0,
        pointProgramme: 0.0,
        pointPasFait: 0.0,
        pointNonRenseigne: 70,
        pointPotentiel: 70,
        pointReferentiel: 70,
        concerne: true,
        totalTachesCount: 3,
        completedTachesCount: 0,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: false,
      });

      expect(scoresMap['eci']).toEqual({
        actionId: 'eci',
        pointFait: 0,
        pointProgramme: 0,
        pointPasFait: 0,
        pointNonRenseigne: 70,
        pointPotentiel: 70,
        pointReferentiel: 100,
        concerne: true,
        totalTachesCount: 5,
        completedTachesCount: 2,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 2,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: false,
      });
    });

    it('notation_should_not_redistribute_points_on_taches_reglementaires', async () => {
      const personnalisationConsequences: PersonnalisationConsequencesByActionId =
        {};
      const actionStatuts: ActionStatutsByActionId = {
        'eci_2.1': {
          concerne: false,
          avancement: 'non_renseigne',
          avancementDetaille: null,
        },
        'eci_2.2': {
          concerne: true,
          avancement: 'fait',
          avancementDetaille: [1, 0, 0],
        },
      };

      const scoresMap = referentielsScoringService.computeScoreMap(
        simpleReferentiel,
        personnalisationConsequences,
        actionStatuts,
        1
      );

      const scoreLength = Object.keys(scoresMap).length;
      expect(scoreLength).toEqual(8);

      expect(scoresMap['eci_2.0']).toEqual({
        actionId: 'eci_2.0',
        pointFait: 0,
        pointProgramme: 0,
        pointPasFait: 0,
        pointNonRenseigne: 0.0,
        pointPotentiel: 0,
        pointReferentiel: 0,
        concerne: true,
        totalTachesCount: 1,
        completedTachesCount: 0,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: false, // WARNING: in python code, it is true but seems to be a mistake
      });

      // Désactivé donc point potentiel à 0
      expect(scoresMap['eci_2.1']).toEqual({
        aStatut: true,
        avancement: 'non_renseigne',
        actionId: 'eci_2.1',
        pointFait: 0,
        pointProgramme: 0,
        pointPasFait: 0,
        pointNonRenseigne: 0,
        pointPotentiel: 0,
        pointReferentiel: 65,
        concerne: false,
        totalTachesCount: 1,
        completedTachesCount: 1,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 1,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: true,
      });

      // Points de eci_2.1 sont redistribués sur eci_2.2
      expect(scoresMap['eci_2.2']).toEqual({
        aStatut: true,
        avancement: 'fait',
        actionId: 'eci_2.2',
        pointFait: 70,
        pointProgramme: 0,
        pointPasFait: 0,
        pointNonRenseigne: 0,
        pointPotentiel: 70,
        pointReferentiel: 5,
        concerne: true,
        totalTachesCount: 1,
        completedTachesCount: 1,
        faitTachesAvancement: 1,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: true,
      });

      expect(scoresMap['eci_2']).toEqual({
        actionId: 'eci_2',
        pointFait: 70,
        pointProgramme: 0.0,
        pointPasFait: 0.0,
        pointNonRenseigne: 0,
        pointPotentiel: 70,
        pointReferentiel: 70,
        concerne: true,
        totalTachesCount: 3,
        completedTachesCount: 2,
        faitTachesAvancement: 1,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 1,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: true,
      });

      expect(scoresMap['eci']).toEqual({
        actionId: 'eci',
        pointFait: 70,
        pointProgramme: 0,
        pointPasFait: 0,
        pointNonRenseigne: 30,
        pointPotentiel: 100,
        pointReferentiel: 100,
        concerne: true,
        totalTachesCount: 5,
        completedTachesCount: 2,
        faitTachesAvancement: 1,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 1,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: false,
      });
    });

    it('Taches doivent être ignorées lorsque les sous-actions sont détaillées', async () => {
      const personnalisationConsequences: PersonnalisationConsequencesByActionId =
        {};
      const actionStatuts: ActionStatutsByActionId = {
        'eci_2.1': {
          concerne: true,
          avancement: 'fait',
          avancementDetaille: [1, 0, 0],
        },
        'eci_2.1.1': {
          concerne: true,
          avancement: 'detaille',
          avancementDetaille: [0.8, 0.2, 0],
        },
      };

      const scoresMap = referentielsScoringService.computeScoreMap(
        deeperReferentiel,
        personnalisationConsequences,
        actionStatuts,
        1
      );

      // Avancement partiel de eci_2.1.1 ne doit pas être pris en compte
      expect(scoresMap['eci_2.1']).toEqual({
        aStatut: true,
        avancement: 'fait',
        actionId: 'eci_2.1',
        pointFait: 65,
        pointProgramme: 0,
        pointPasFait: 0,
        pointNonRenseigne: 0,
        pointPotentiel: 65,
        pointReferentiel: 65,
        completedTachesCount: 3,
        totalTachesCount: 3,
        faitTachesAvancement: 3,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        concerne: true,
        pointPotentielPerso: null,
        desactive: false,
        renseigne: true,
      });
    });

    it('Taches doivent être prises en compte lorsque les statuts des sous-actions existent mais sont non_renseigne', async () => {
      const personnalisationConsequences: PersonnalisationConsequencesByActionId =
        {};
      const actionStatuts: ActionStatutsByActionId = {
        'eci_2.1': {
          concerne: true,
          avancement: 'non_renseigne',
          avancementDetaille: [0, 0, 0],
        },
        'eci_2.1.1': {
          concerne: true,
          avancement: 'detaille',
          avancementDetaille: [0.8, 0.2, 0],
        },
      };

      const scoresMap = referentielsScoringService.computeScoreMap(
        deeperReferentiel,
        personnalisationConsequences,
        actionStatuts,
        1
      );

      // Avancement partiel de eci_2.1.1 ne doit pas être pris en compte
      expect(scoresMap['eci_2.1']).toEqual({
        aStatut: true,
        avancement: 'non_renseigne',
        actionId: 'eci_2.1',
        pointFait: 32,
        pointProgramme: 8,
        pointPasFait: 0,
        pointNonRenseigne: 25,
        pointPotentiel: 65,
        pointReferentiel: 65,
        completedTachesCount: 1,
        totalTachesCount: 3,
        faitTachesAvancement: 0.8,
        programmeTachesAvancement: 0.2,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        concerne: true,
        pointPotentielPerso: null,
        desactive: false,
        renseigne: false,
      });
    });

    it('Statut non concerné ne doit pas être pris des enfants si défini explicitement au niveau du parent', async () => {
      const personnalisationConsequences: PersonnalisationConsequencesByActionId =
        {};
      const actionStatuts: ActionStatutsByActionId = {
        'cae_4.2.1.2': {
          avancement: 'pas_fait',
          avancementDetaille: [0, 0, 1],
          concerne: true,
        },
        'cae_4.2.1.2.1': {
          avancement: 'non_renseigne',
          avancementDetaille: [0, 0, 0],
          concerne: false,
        },
        'cae_4.2.1.2.3': {
          avancement: 'non_renseigne',
          avancementDetaille: [0, 0, 0],
          concerne: false,
        },
        'cae_4.2.1.2.4': {
          avancement: 'non_renseigne',
          avancementDetaille: [0, 0, 0],
          concerne: false,
        },
        'cae_4.2.1.2.2': {
          avancement: 'non_renseigne',
          avancementDetaille: [0, 0, 0],
          concerne: false,
        },
      };

      const scoresMap = referentielsScoringService.computeScoreMap(
        caeReferentiel,
        personnalisationConsequences,
        actionStatuts,
        3
      );

      // Avancement partiel de eci_2.1.1 ne doit pas être pris en compte
      expect(scoresMap['cae_4.2.1.2']).toEqual({
        aStatut: true,
        avancement: 'pas_fait',
        actionId: 'cae_4.2.1.2',
        completedTachesCount: 4,
        concerne: true,
        faitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        pointFait: 0,
        pointPasFait: 1.6,
        pointNonRenseigne: 0,
        pointPotentiel: 1.6,
        pointProgramme: 0,
        pointReferentiel: 1.6,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 4,
        renseigne: true,
        desactive: false,
        totalTachesCount: 4,
        pointPotentielPerso: null,
      });
    });

    it('notation_should_redistribute_non_concernee_points_if_depth_is_greater_than_action_depth', async () => {
      const personnalisationConsequences: PersonnalisationConsequencesByActionId =
        {};

      const actionStatuts: ActionStatutsByActionId = {
        'eci_2.2.1': {
          concerne: false,
          avancement: 'non_renseigne',
          avancementDetaille: null,
        },
        'eci_2.2.2': {
          concerne: false,
          avancement: 'non_renseigne',
          avancementDetaille: null,
        },
        'eci_2.2.3': {
          concerne: false,
          avancement: 'non_renseigne',
          avancementDetaille: null,
        },
        'eci_1.1': {
          concerne: true,
          avancement: 'programme',
          avancementDetaille: [0, 1, 0],
        },
      };

      const scoresMap = referentielsScoringService.computeScoreMap(
        deeperReferentiel,
        personnalisationConsequences,
        actionStatuts,
        1
      );

      const scoreLength = Object.keys(scoresMap).length;
      expect(scoreLength).toEqual(14);

      expect(scoresMap['eci_2.2']).toEqual({
        actionId: 'eci_2.2',
        pointFait: 0,
        pointProgramme: 0,
        pointPasFait: 0,
        pointNonRenseigne: 0,
        pointPotentiel: 0,
        pointReferentiel: 5,
        completedTachesCount: 3,
        totalTachesCount: 3,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 3,
        concerne: false,
        pointPotentielPerso: null,
        desactive: false,
        renseigne: true,
      });

      // pointReferentiel of 2.2 is redistributed on 2.1
      expect(scoresMap['eci_2.1']).toEqual({
        actionId: 'eci_2.1',
        pointFait: 0,
        pointProgramme: 0,
        pointPasFait: 0,
        pointNonRenseigne: 70,
        pointPotentiel: 70,
        pointReferentiel: 65,
        completedTachesCount: 0,
        totalTachesCount: 3,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        concerne: true,
        pointPotentielPerso: null,
        desactive: false,
        renseigne: false,
      });

      expect(scoresMap['eci_2.1.0']).toEqual({
        actionId: 'eci_2.1.0',
        pointFait: 0,
        pointProgramme: 0,
        pointPasFait: 0,
        pointNonRenseigne: 0,
        pointPotentiel: 0,
        pointReferentiel: 0,
        completedTachesCount: 0,
        totalTachesCount: 1,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        concerne: true,
        pointPotentielPerso: null,
        desactive: false,
        renseigne: false,
      });

      expect(scoresMap['eci_2.1.1']).toEqual({
        actionId: 'eci_2.1.1',
        pointFait: 0,
        pointProgramme: 0,
        pointPasFait: 0,
        pointNonRenseigne: roundTo((40 / 65) * 70, 3),
        pointPotentiel: roundTo((40 / 65) * 70, 3),
        pointReferentiel: 40,
        completedTachesCount: 0,
        totalTachesCount: 1,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        concerne: true,
        pointPotentielPerso: null,
        desactive: false,
        renseigne: false,
      });

      expect(scoresMap['eci_2.1.2']).toEqual({
        actionId: 'eci_2.1.2',
        pointFait: 0,
        pointProgramme: 0,
        pointPasFait: 0,
        pointNonRenseigne: roundTo((25 / 65) * 70, 3),
        pointPotentiel: roundTo((25 / 65) * 70, 3),
        pointReferentiel: 25,
        completedTachesCount: 0,
        totalTachesCount: 1,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        concerne: true,
        pointPotentielPerso: null,
        desactive: false,
        renseigne: false,
      });

      // axe 2 pointFait should remain unchanged
      expect(scoresMap['eci_2']).toEqual({
        actionId: 'eci_2',
        pointFait: 0,
        pointPasFait: 0,
        pointProgramme: 0,
        pointNonRenseigne: 70,
        pointPotentiel: 70,
        pointReferentiel: 70,
        completedTachesCount: 3,
        totalTachesCount: 7,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 3,
        concerne: true,
        pointPotentielPerso: null,
        desactive: false,
        renseigne: false,
      });

      // root pointFait should remain unchanged
      expect(scoresMap['eci']).toEqual({
        actionId: 'eci',
        pointFait: 0,
        pointProgramme: 10,
        pointPasFait: 0,
        pointNonRenseigne: 90,
        pointPotentiel: 100,
        pointReferentiel: 100,
        completedTachesCount: 4,
        totalTachesCount: 9,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 1,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 3,
        concerne: true,
        pointPotentielPerso: null,
        desactive: false,
        renseigne: false,
      });
    });

    it('notation_when_one_action_is_desactivee', async () => {
      const personnalisationConsequences: PersonnalisationConsequencesByActionId =
        {
          eci_1: {
            desactive: true,
            scoreFormule: null,
            potentielPerso: null,
          },
        };
      const actionStatuts: ActionStatutsByActionId = {
        'eci_2.2': {
          concerne: true,
          avancement: 'fait',
          avancementDetaille: [1, 0, 0],
        },
      };

      const scoresMap = referentielsScoringService.computeScoreMap(
        simpleReferentiel,
        personnalisationConsequences,
        actionStatuts,
        1
      );

      //  Only action eci_1 should de desactive and potentiel reduced to 0
      expect(scoresMap['eci_1'].desactive).toEqual(true);
      expect(scoresMap['eci_1'].pointPotentielPerso).toEqual(null);
      // Point potentiel is impacted by desactivation
      expect(scoresMap['eci_1'].pointPotentiel).toEqual(0);
      // Point referentiel is not impacted by desactivation
      expect(scoresMap['eci_1'].pointReferentiel).toEqual(30);

      // Consequences on action children should affect pointPotentiel (reduced to 0) but not pointPotentielPerso that is null
      expect(scoresMap['eci_1.1'].desactive).toEqual(true);
      expect(scoresMap['eci_1.1'].pointPotentielPerso).toEqual(null);
      // Point potentiel is impacted by desactivation
      expect(scoresMap['eci_1.1'].pointPotentiel).toEqual(0);
      // Point referentiel is not impacted by desactivation
      expect(scoresMap['eci_1.1'].pointReferentiel).toEqual(10);
      expect(scoresMap['eci_1.2'].desactive).toEqual(true);
      expect(scoresMap['eci_1.2'].pointPotentielPerso).toEqual(null);
      // Point potentiel is impacted by desactivation
      expect(scoresMap['eci_1.2'].pointPotentiel).toEqual(0);
      // Point referentiel is not impacted by desactivation
      expect(scoresMap['eci_1.2'].pointReferentiel).toEqual(20);

      // Consequences should also affect action parent potentiel points
      expect(scoresMap['eci'].pointPotentiel).toEqual(70);
      // Consequences should not affect parent point referentiel, desactive and pointPotentielPerso
      expect(scoresMap['eci'].desactive).toEqual(false);
      expect(scoresMap['eci'].pointPotentielPerso).toEqual(null);
      expect(scoresMap['eci'].pointReferentiel).toEqual(100);

      // Check scores are still calculated correctly
      expect(scoresMap['eci'].pointFait).toEqual(5);
      expect(scoresMap['eci_2.2'].pointFait).toEqual(5);
    });

    it('notation_when_one_action_is_reduced', async () => {
      const personnalisationConsequences: PersonnalisationConsequencesByActionId =
        {
          eci_1: {
            desactive: null,
            scoreFormule: null,
            potentielPerso: 0.2, // Action eci_1 officially worse 30 points, so will be reduced to 6 points
          },
        };
      const actionStatuts: ActionStatutsByActionId = {
        'eci_1.1': {
          concerne: true,
          avancement: 'fait',
          avancementDetaille: [1, 0, 0],
        },
      };

      const scoresMap = referentielsScoringService.computeScoreMap(
        simpleReferentiel,
        personnalisationConsequences,
        actionStatuts,
        1
      );

      // Actions eci_1.1 and eci_1.2 should also have been reduced with a factor of 0.2
      expect(scoresMap['eci_1.1']).toEqual({
        aStatut: true,
        avancement: 'fait',
        actionId: 'eci_1.1',
        pointFait: 2.0,
        pointProgramme: 0.0,
        pointPasFait: 0.0,
        pointNonRenseigne: 0.0,
        pointPotentiel: 2.0,
        pointReferentiel: 10,
        concerne: true,
        totalTachesCount: 1,
        completedTachesCount: 1,
        faitTachesAvancement: 1,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: true,
      });

      expect(scoresMap['eci_1.2']).toEqual({
        actionId: 'eci_1.2',
        pointFait: 0.0,
        pointProgramme: 0.0,
        pointPasFait: 0.0,
        pointNonRenseigne: 4.0,
        pointPotentiel: 4.0,
        pointReferentiel: 20,
        concerne: true,
        totalTachesCount: 1,
        completedTachesCount: 0,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: false,
      });

      expect(scoresMap['eci_1']).toEqual({
        actionId: 'eci_1',
        pointFait: 2.0,
        pointProgramme: 0.0,
        pointPasFait: 0.0,
        pointNonRenseigne: 4.0,
        pointPotentiel: 6.0,
        pointReferentiel: 30,
        concerne: true,
        totalTachesCount: 2,
        completedTachesCount: 1,
        faitTachesAvancement: 1,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: 6.0,
        renseigne: false,
      });

      expect(scoresMap['eci']).toEqual({
        actionId: 'eci',
        pointFait: 2.0,
        pointProgramme: 0.0,
        pointPasFait: 0.0,
        pointNonRenseigne: 74.0,
        pointPotentiel: 76.0,
        pointReferentiel: 100,
        concerne: true,
        totalTachesCount: 5,
        completedTachesCount: 1,
        faitTachesAvancement: 1,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: false,
      });
    });

    it('notation_when_one_action_is_increased', async () => {
      const personnalisationConsequences: PersonnalisationConsequencesByActionId =
        {
          eci_1: {
            desactive: null,
            scoreFormule: null,
            potentielPerso: 1.2, // Action eci_1 officially worse 30 points, so will be increased to 36 points
          },
        };
      const actionStatuts: ActionStatutsByActionId = {
        'eci_1.1': {
          concerne: true,
          avancement: 'fait',
          avancementDetaille: [1, 0, 0],
        },
      };

      const scoresMap = referentielsScoringService.computeScoreMap(
        simpleReferentiel,
        personnalisationConsequences,
        actionStatuts,
        1
      );

      // Actions eci_1.1 and eci_1.2 should also have been reduced with a factor of 1.2
      expect(scoresMap['eci_1.1']).toEqual({
        aStatut: true,
        avancement: 'fait',
        actionId: 'eci_1.1',
        pointFait: 12.0,
        pointProgramme: 0.0,
        pointPasFait: 0.0,
        pointNonRenseigne: 0.0,
        pointPotentiel: 12.0, // 10 * 1.2
        pointReferentiel: 10,
        concerne: true,
        totalTachesCount: 1,
        completedTachesCount: 1,
        faitTachesAvancement: 1,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: true,
      });

      expect(scoresMap['eci_1.2']).toEqual({
        actionId: 'eci_1.2',
        pointFait: 0.0,
        pointProgramme: 0.0,
        pointPasFait: 0.0,
        pointNonRenseigne: 24.0,
        pointPotentiel: 24.0, // 20 * 1.2
        pointReferentiel: 20,
        concerne: true,
        totalTachesCount: 1,
        completedTachesCount: 0,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: false,
      });

      expect(scoresMap['eci_1']).toEqual({
        actionId: 'eci_1',
        pointFait: 12.0,
        pointProgramme: 0.0,
        pointPasFait: 0.0,
        pointNonRenseigne: 24.0,
        pointPotentiel: 36, //  (30 * 1.2)
        pointReferentiel: 30,
        concerne: true,
        totalTachesCount: 2,
        completedTachesCount: 1,
        faitTachesAvancement: 1,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: 36.0, // Consequence applied here ! (30 * 1.2)
        renseigne: false,
      });

      expect(scoresMap['eci']).toEqual({
        actionId: 'eci',
        pointFait: 12.0,
        pointProgramme: 0.0,
        pointPasFait: 0.0,
        pointNonRenseigne: 94.0,
        pointPotentiel: 106.0, //  (70 from eci_2 and 36 from eci_1)
        pointReferentiel: 100,
        concerne: true,
        totalTachesCount: 5,
        completedTachesCount: 1,
        faitTachesAvancement: 1,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: false,
      });
    });

    it('notation_when_potentielPerso_formule_is_given', async () => {
      const personnalisationConsequences: PersonnalisationConsequencesByActionId =
        {
          eci_1: {
            desactive: null,
            scoreFormule: 'min(score(eci_1), score(eci_2))',
            potentielPerso: null,
          },
        };
      const actionStatuts: ActionStatutsByActionId = {
        'eci_2.2': {
          concerne: true,
          avancement: 'fait',
          avancementDetaille: [1, 0, 0], // 5 points
        },
        'eci_1.1': {
          concerne: true,
          avancement: 'fait',
          avancementDetaille: [1, 0, 0], // 10 points
        },
        'eci_1.2': {
          concerne: true,
          avancement: 'fait',
          avancementDetaille: [1, 0, 0], // 20 points
        },
      };

      const scoresMap = referentielsScoringService.computeScoreMap(
        simpleReferentiel,
        personnalisationConsequences,
        actionStatuts,
        1
      );

      // Action eci_2 should not have been changed
      expect(scoresMap['eci_2']).toEqual({
        actionId: 'eci_2',
        pointFait: 5,
        pointProgramme: 0.0,
        pointPasFait: 0.0,
        pointNonRenseigne: 65,
        pointPotentiel: 70,
        pointReferentiel: 70,
        concerne: true,
        totalTachesCount: 3,
        completedTachesCount: 1,
        faitTachesAvancement: 1,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 0,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: false,
      });

      expect(
        roundTo(
          (scoresMap['eci_1'].pointFait as number) /
            (scoresMap['eci_1'].pointPotentiel as number),
          5
        )
      ).toEqual(
        roundTo(
          (scoresMap['eci_2'].pointFait as number) /
            (scoresMap['eci_2'].pointPotentiel as number),
          5
        )
      );

      expect(scoresMap['eci_1'].pointFait).toEqual(2.143);
      expect(scoresMap['eci_1.1'].pointFait).toEqual(0.714);
      expect(scoresMap['eci_1.2'].pointFait).toEqual(1.429);
      expect(scoresMap['eci'].pointFait).toEqual(7.143);
    });

    it('eci_desactivation_of_sous_action_242_should_redistribute_points_amongst_siblings', async () => {
      const personnalisationConsequences: PersonnalisationConsequencesByActionId =
        {
          'eci_2.4.2': {
            desactive: true,
            scoreFormule: null,
            potentielPerso: null,
          },
        };
      const actionStatuts: ActionStatutsByActionId = {};

      const scoresMap = referentielsScoringService.computeScoreMap(
        eciReferentiel,
        personnalisationConsequences,
        actionStatuts,
        2
      );

      expect(scoresMap['eci_2.4.2']).toEqual({
        actionId: 'eci_2.4.2',
        pointFait: 0.0,
        pointProgramme: 0.0,
        pointPasFait: 0.0,
        pointNonRenseigne: 0.0,
        pointPotentiel: 0.0,
        pointReferentiel: 4,
        concerne: false,
        totalTachesCount: 4,
        completedTachesCount: 4,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 4,
        desactive: true,
        pointPotentielPerso: null,
        renseigne: true,
      });

      // Points correctement redistribués
      expect(scoresMap['eci_2.4.0'].pointPotentiel).toEqual(0); // action réglementaire
      expect(scoresMap['eci_2.4.1'].pointPotentiel).toEqual(5); // 4 + 1
      expect(scoresMap['eci_2.4.2'].pointPotentiel).toEqual(0); // désactivé
      expect(scoresMap['eci_2.4.3'].pointPotentiel).toEqual(3); // 2 + 1
      expect(scoresMap['eci_2.4.4'].pointPotentiel).toEqual(7); // 6 + 1
      expect(scoresMap['eci_2.4.5'].pointPotentiel).toEqual(5); // 4 + 1

      // Toujours 20 points pour eci_2.4
      expect(scoresMap['eci_2.4']).toEqual({
        actionId: 'eci_2.4',
        pointFait: 0.0,
        pointProgramme: 0.0,
        pointPasFait: 0.0,
        pointNonRenseigne: 20.0,
        pointPotentiel: 20.0,
        pointReferentiel: 20,
        concerne: true,
        totalTachesCount: 17,
        completedTachesCount: 4,
        faitTachesAvancement: 0,
        programmeTachesAvancement: 0,
        pasFaitTachesAvancement: 0,
        pasConcerneTachesAvancement: 4,
        desactive: false,
        pointPotentielPerso: null,
        renseigne: false,
      });
    });

    it('cae_321_when_recuperation_cogeneration_is_NON', async () => {
      const reponses: PersonnalisationReponsesPayload = {
        recuperation_cogeneration: false,
      };
      const collectiviteInfo: IdentiteCollectivite = {
        type: CollectiviteTypeEnum.COMMUNE,
        soustype: null,
        populationTags: [],
        drom: false,
      };
      const personnalisationConsequences =
        await personnalisationService.getPersonnalisationConsequences(
          caePersonnalisationRegles,
          reponses,
          collectiviteInfo
        );

      const actionStatuts: ActionStatutsByActionId = {};

      const scoresMap = referentielsScoringService.computeScoreMap(
        caeReferentiel,
        personnalisationConsequences,
        actionStatuts,
        3
      );

      // Si la récupération recuperation_cogeneration est NON, alors, cae_3.2.1.2 et cae_3.2.1.3 sont désactivées et cae_3.2.1.1 vaut 2 points
      expect(scoresMap['cae_3.2.1.2'].pointPotentiel).toEqual(0);
      expect(scoresMap['cae_3.2.1.2'].desactive).toEqual(true);
      expect(scoresMap['cae_3.2.1.3'].concerne).toEqual(false);
      expect(scoresMap['cae_3.2.1.3'].pointPotentiel).toEqual(0);
      expect(scoresMap['cae_3.2.1.3'].desactive).toEqual(true);
      expect(scoresMap['cae_3.2.1.3'].concerne).toEqual(false);

      expect(scoresMap['cae_3.2.1'].pointPotentielPerso).toEqual(2);
      expect(scoresMap['cae_3.2.1'].pointPotentiel).toEqual(2);
      expect(scoresMap['cae_3.2.1.1'].pointPotentiel).toEqual(2);
      expect(scoresMap['cae_3.2.1.1.1'].pointPotentiel).toEqual(0.25);
    });

    it('cae_631_when_dev_eco_2_is_0', async () => {
      const reponses: PersonnalisationReponsesPayload = {
        dev_eco_2: 0.0,
      };
      const collectiviteInfo: IdentiteCollectivite = {
        type: CollectiviteTypeEnum.COMMUNE,
        soustype: null,
        populationTags: [],
        drom: false,
      };
      const personnalisationConsequences =
        await personnalisationService.getPersonnalisationConsequences(
          caePersonnalisationRegles,
          reponses,
          collectiviteInfo
        );

      const actionStatuts: ActionStatutsByActionId = {};

      const scoresMap = referentielsScoringService.computeScoreMap(
        caeReferentiel,
        personnalisationConsequences,
        actionStatuts,
        3
      );

      expect(scoresMap['cae_6.3.1'].pointPotentiel).toEqual(2);
      expect(scoresMap['cae_6.3.1'].pointPotentielPerso).toEqual(2);
    });

    it('cae_631_when_cae_6314_if_dev_eco_4_is_NON', async () => {
      /*
    En l’absence de tissu économique propice à l’émergence de projets d’écologie industrielle, le score de la 6.3.1.4
    est réduit à 0 et son statut est "non concerné" : les 2 points liés sont affectés à la 6.3.1.3 et la 6.3.1.5

    Lié aux règles de personnalisation sur 6.3.1.4, 6.3.1.3, 6.3.1.5. On n'utilise pas la redistributin automatique de potentiel dans ce cas

    Scénario testé:
    ---------------
    si reponse(dev_eco_4, NON) alors
      - 6.3.1.1 proportion 15% => 15%
      - 6.3.1.2 proportion 20% => 20%
      - 6.3.1.3 proportion 20% => 32.5%
      - 6.3.1.4 proportion 25% => Désactivé, non-concerné, 0%
      - 6.3.1.5 proportion 20% => 32.5%
      */

      const reponses: PersonnalisationReponsesPayload = {
        dev_eco_4: false,
      };
      const collectiviteInfo: IdentiteCollectivite = {
        type: CollectiviteTypeEnum.COMMUNE,
        soustype: null,
        populationTags: [],
        drom: false,
      };
      const personnalisationConsequences =
        await personnalisationService.getPersonnalisationConsequences(
          caePersonnalisationRegles,
          reponses,
          collectiviteInfo
        );

      const actionStatuts: ActionStatutsByActionId = {};

      const scoresMap = referentielsScoringService.computeScoreMap(
        caeReferentiel,
        personnalisationConsequences,
        actionStatuts,
        3
      );

      expect(scoresMap['cae_6.3.1.4'].desactive).toEqual(true);
      expect(scoresMap['cae_6.3.1.4'].pointPotentiel).toEqual(0);
      expect(scoresMap['cae_6.3.1.4'].concerne).toEqual(false);

      // Pas de redistribution automatique de potentiel (car on a des règles de personnalisation) donc les points de cae_6.3.1.1 et cae_6.3.1.2 restent inchangés
      expect(scoresMap['cae_6.3.1.1'].pointPotentiel).toEqual(
        scoresMap['cae_6.3.1.1'].pointReferentiel
      );
      expect(scoresMap['cae_6.3.1.2'].pointPotentiel).toEqual(
        scoresMap['cae_6.3.1.2'].pointReferentiel
      );

      // Les points de  cae_6.3.1.3 et cae_6.3.1.5 ont été augmentés de 1 point chacun (facteur 1.625 dans les règles de personnalisation)
      expect(scoresMap['cae_6.3.1.3'].pointPotentiel).toEqual(
        (scoresMap['cae_6.3.1.3'].pointReferentiel || 0) + 1
      );
      expect(scoresMap['cae_6.3.1.3'].pointPotentiel).toEqual(
        (scoresMap['cae_6.3.1.3'].pointReferentiel || 0) * 1.625
      );
      expect(scoresMap['cae_6.3.1.5'].pointPotentiel).toEqual(
        (scoresMap['cae_6.3.1.5'].pointReferentiel || 0) + 1
      );
      expect(scoresMap['cae_6.3.1.5'].pointPotentiel).toEqual(
        (scoresMap['cae_6.3.1.5'].pointReferentiel || 0) * 1.625
      );

      // Les points de cae_6.3.1 restent inchangés
      expect(scoresMap['cae_6.3.1'].pointPotentiel).toEqual(
        scoresMap['cae_6.3.1'].pointReferentiel
      );
    });

    it('cae_641_when_localosation_dom_and_SAU_OUI', async () => {
      /*
    Reduction de 50% de la 6.4.1 & transfert de qqes points de la 6.4.1.6 à la 6.4.1.8.
    La note du référentiel actuel est à 15 %. Pour les collectivités DOM, la note de la sous-action passe à 20 % de 6 points (12 * 0.5).
    La note du référentiel actuel est à 15 %. Pour les collectivités DOM, la note de la sous-action passe à 10 % de 6 points (12 * 0.5).

    Scénario testé:
    ---------------
    si identite(localisation, DOM) alors
        - 6.4.1.1, 6.4.1.2, 6.4.1.3, 6.4.1.4, 6.4.1.5 et 6.4.1.7 inchangées
        - 6.4.1.6 passe de 15% à 20%
        - 6.4.1.8 passe de 15% à 10%
      */

      const reponses: PersonnalisationReponsesPayload = {
        SAU: true,
      };
      const collectiviteInfo: IdentiteCollectivite = {
        type: CollectiviteTypeEnum.COMMUNE,
        soustype: null,
        populationTags: [],
        drom: true,
      };
      const personnalisationConsequences =
        await personnalisationService.getPersonnalisationConsequences(
          caePersonnalisationRegles,
          reponses,
          collectiviteInfo
        );

      const actionStatuts: ActionStatutsByActionId = {};

      const scoresMap = referentielsScoringService.computeScoreMap(
        caeReferentiel,
        personnalisationConsequences,
        actionStatuts,
        3
      );

      expect(scoresMap['cae_6.4.1'].pointPotentiel).toEqual(
        (scoresMap['cae_6.4.1'].pointReferentiel || 0) * 0.5
      );
      expect(scoresMap['cae_6.4.1'].pointPotentielPerso).toEqual(
        (scoresMap['cae_6.4.1'].pointReferentiel || 0) * 0.5
      );

      // Seulement affecté par la réduction de potentiel du parent pour ces actions
      const actionIdsWithoutAugmentation = [
        'cae_6.4.1.1',
        'cae_6.4.1.2',
        'cae_6.4.1.3',
        'cae_6.4.1.4',
        'cae_6.4.1.5',
        'cae_6.4.1.7',
      ];
      actionIdsWithoutAugmentation.forEach((actionId) => {
        expect(scoresMap[actionId].pointPotentiel).toEqual(
          (scoresMap[actionId].pointReferentiel || 0) * 0.5
        );
      });

      // 6.4.1.6 passe de 15% à 20%
      expect(scoresMap['cae_6.4.1.6'].pointPotentiel).toEqual(
        ((scoresMap['cae_6.4.1'].pointPotentiel || 0) * 20) / 100
      );
      expect(scoresMap['cae_6.4.1.6'].pointPotentiel).toEqual(1.2);

      // 6.4.1.8 passe de 15% à 10%
      expect(scoresMap['cae_6.4.1.8'].pointPotentiel).toEqual(
        ((scoresMap['cae_6.4.1'].pointPotentiel || 0) * 10) / 100
      );
      expect(scoresMap['cae_6.4.1.8'].pointPotentiel).toEqual(0.6);
    });

    it('cae_621_when_type_commune', async () => {
      /*
    Reduction potentiel cae 6.2.1 liee logement-habitat

    Si la collectivité est une commune, alors la réduction de potentiel est proportionnelle à la part dans l’EPCI compétent en matière de politique du logement et du cadre de vie, dans la limite de 2 points restant minimum.
    Si la commune participe au conseil d’administration d'un bailleur social, le potentiel, possiblement réduit est
    augmenté d'un point sur la 6.2.1
      */

      const collectiviteInfo: IdentiteCollectivite = {
        type: CollectiviteTypeEnum.COMMUNE,
        soustype: null,
        populationTags: [],
        drom: false,
      };
      const actionStatuts: ActionStatutsByActionId = {};

      /**
     Cas 1 :  Si une commune est à 10 % de l'EPCI et qu'elle participe au conseil d'administration d'un bailleur social, elle est notée sur 3 points
     ------
     si identite(type, commune) et reponse(habitat_3, OUI) et reponse(habitat_2, 10%)
     - cae 6.2.1 est réduite à 2 points et on lui ajoute 1 point, donc a un potentiel de 3 points
     */

      const reponsesCas1: PersonnalisationReponsesPayload = {
        habitat_3: true,
        habitat_2: 0.1,
      };
      const personnalisationConsequencesCas1 =
        await personnalisationService.getPersonnalisationConsequences(
          caePersonnalisationRegles,
          reponsesCas1,
          collectiviteInfo
        );

      const scoresMapCas1 = referentielsScoringService.computeScoreMap(
        caeReferentiel,
        personnalisationConsequencesCas1,
        actionStatuts,
        3
      );

      expect(scoresMapCas1['cae_6.2.1'].pointPotentiel).toEqual(3);

      /**
       Cas 2 :  Si une commune est à 50 % de l'EPCI et qu'elle participe au conseil d'administration d'un bailleur social, elle est notée sur 6 points
       -------
       si identite(type, commune) et reponse(habitat_3, OUI) et reponse(habitat_2, 50%)
       - cae 6.2.1 est réduite de 50% et on lui ajoute 1 point, donc a un potentiel de 6 points
       */

      const reponsesCas2: PersonnalisationReponsesPayload = {
        habitat_3: true,
        habitat_2: 0.5,
      };
      const personnalisationConsequencesCas2 =
        await personnalisationService.getPersonnalisationConsequences(
          caePersonnalisationRegles,
          reponsesCas2,
          collectiviteInfo
        );
      const scoresMapCas2 = referentielsScoringService.computeScoreMap(
        caeReferentiel,
        personnalisationConsequencesCas2,
        actionStatuts,
        3
      );

      expect(scoresMapCas2['cae_6.2.1'].pointPotentiel).toEqual(6);

      /**
       Cas 3 :  Si une commune est à 10 % de l'EPCI et qu'elle ne participe pas au conseil d'administration d'un bailleur social, elle est notée sur 2 points
       ------
       si identite(type, commune) et reponse(habitat_3, NON) et reponse(habitat_2, 10%)
       - cae 6.2.1 est réduite à 2 points et on ne lui rajoute pas de points, donc a un potentiel de 2 points
       */

      const reponsesCas3: PersonnalisationReponsesPayload = {
        habitat_3: false,
        habitat_2: 0.1,
      };
      const personnalisationConsequencesCas3 =
        await personnalisationService.getPersonnalisationConsequences(
          caePersonnalisationRegles,
          reponsesCas3,
          collectiviteInfo
        );
      const scoresMapCas3 = referentielsScoringService.computeScoreMap(
        caeReferentiel,
        personnalisationConsequencesCas3,
        actionStatuts,
        3
      );

      expect(scoresMapCas3['cae_6.2.1'].pointPotentiel).toEqual(2);
    });

    it('cae_335_with_score_taken_into_account', async () => {
      /*
    Overide du score de cae_3.3.5 liée au score obtenue à l'action cae_1.2.3

    Pour une commune, la note est réduite à 2 points en l'absence de la compétence traitement des déchets.
    Pour un EPCI ayant transféré la compétence traitement des déchets à un syndicat compétent en la matière, la note est réduite proportionnelle à sa participation dans ce syndicat, dans la limite de 2 points restants.
    Pour favoriser la prévention des déchets, la note attribuée à cette action ne peut dépasser celle obtenue dans l'action 1.2.3.
      */

      const communeInfo: IdentiteCollectivite = {
        type: CollectiviteTypeEnum.COMMUNE,
        soustype: null,
        populationTags: [],
        drom: false,
      };
      const epciInfo: IdentiteCollectivite = {
        type: CollectiviteTypeEnum.EPCI,
        soustype: null,
        populationTags: [],
        drom: false,
      };

      /**
     Cas 1 :  Si commune avec compétence traitement déchets, il n'y a pas de réduction de potentiel.
     ------

     Quand reponse(dechets_2, OUI), cae_1.2.3 est réduit de 0.75, et est donc notée sur 7.5 points au lieu de 10 points.
     La sous-action cae_1.2.3.3 représente 30% de l'action donc est noté sur 30% de 7.5 points, ce qui fait 2.25 points.
     La sous-action cae_3.3.5.3 vaut initiallement 4.8 points
     Chaque tâche de cette sous-saction vaut 1.2 points, donc si une tâche est faite, score_realise(cae_3.3.5) = 1.2
     */

      const actionStatutsCas1: ActionStatutsByActionId = {
        'cae_1.2.3.3.1': {
          concerne: true,
          avancement: 'fait',
          avancementDetaille: [1, 0, 0],
        },
        'cae_1.2.3.3.2': {
          concerne: true,
          avancement: 'fait',
          avancementDetaille: [1, 0, 0],
        },
        'cae_1.2.3.3.3': {
          concerne: true,
          avancement: 'fait',
          avancementDetaille: [1, 0, 0],
        },
        'cae_1.2.3.3.4': {
          concerne: true,
          avancement: 'fait',
          avancementDetaille: [1, 0, 0],
        },
        'cae_1.2.3.3.5': {
          concerne: true,
          avancement: 'fait',
          avancementDetaille: [1, 0, 0],
        },
        'cae_3.3.5.3.1': {
          concerne: true,
          avancement: 'fait',
          avancementDetaille: [1, 0, 0],
        },
      };

      const reponsesCas1: PersonnalisationReponsesPayload = {
        dechets_1: false,
        dechets_2: true,
        dechets_3: false,
      };
      const personnalisationConsequencesCas1 =
        await personnalisationService.getPersonnalisationConsequences(
          caePersonnalisationRegles,
          reponsesCas1,
          communeInfo
        );

      const scoresMapCas1 = referentielsScoringService.computeScoreMap(
        caeReferentiel,
        personnalisationConsequencesCas1,
        actionStatutsCas1,
        3
      );

      expect(scoresMapCas1['cae_1.2.3'].pointFait).toEqual(2.25);
      expect(scoresMapCas1['cae_3.3.5'].pointFait).toEqual(1.2);

      /**
       Cas 2 :  Si commune avec compétence déchets, il n'y a pas de réduction de potentiel mais le score de la 3.3.5 est majoré par celui de la 1.2.3
       La sous-action cae_3.3.5.3 vaut initialement 4.8 points
       Chaque tâche de cette sous-saction vaut 1.2 points, donc si une tâche est faite, score_realise(cae_3.3.5) = 1.2
       Aucune réponse pour cae_1.2.3 => score_realise(cae_1.2.3) = 0
       La majoration du score de la 3.3.5 par la 1.2.3 entraîne donc que la 3.3.5 vaut a un score réalisé de 0 point.
       */

      const actionStatutsCas2: ActionStatutsByActionId = {
        'cae_3.3.5.3.1': {
          concerne: true,
          avancement: 'fait',
          avancementDetaille: [1, 0, 0],
        },
      };

      const reponsesCas2: PersonnalisationReponsesPayload = {
        dechets_2: true,
      };
      const personnalisationConsequencesCas2 =
        await personnalisationService.getPersonnalisationConsequences(
          caePersonnalisationRegles,
          reponsesCas2,
          communeInfo
        );

      const scoresMapCas2 = referentielsScoringService.computeScoreMap(
        caeReferentiel,
        personnalisationConsequencesCas2,
        actionStatutsCas2,
        3
      );

      expect(scoresMapCas2['cae_1.2.3'].pointFait).toEqual(0);
      expect(scoresMapCas2['cae_3.3.5'].pointFait).toEqual(0); // Au lieu de 1.2 !

      /**
       Cas 3 :  Si EPCI sans compétence déchets et participation dans syndicat compétent de 10% et points_fait(cae_1.2.3, 2.25) alors potentiel(cae_3.3.5) = 2
       Quand reponse(dechets_2, NON), cae_1.2.3.3 est réduite de 75% et donc notée sur 2.25 points au lieu de 3 points
       Si toutes les tâches sont faites, alors le score réalisé de cae_1.2.3 est de 2.25
      */

      const actionStatutsCas3: ActionStatutsByActionId = {
        'cae_1.2.3.3.1': {
          concerne: true,
          avancement: 'fait',
          avancementDetaille: [1, 0, 0],
        },
        'cae_1.2.3.3.2': {
          concerne: true,
          avancement: 'fait',
          avancementDetaille: [1, 0, 0],
        },
        'cae_1.2.3.3.3': {
          concerne: true,
          avancement: 'fait',
          avancementDetaille: [1, 0, 0],
        },
        'cae_1.2.3.3.4': {
          concerne: true,
          avancement: 'fait',
          avancementDetaille: [1, 0, 0],
        },
        'cae_1.2.3.3.5': {
          concerne: true,
          avancement: 'fait',
          avancementDetaille: [1, 0, 0],
        },
      };

      const reponsesCas3: PersonnalisationReponsesPayload = {
        dechets_1: true,
        dechets_2: false,
        dechets_4: 0.1,
      };

      const personnalisationConsequencesCas3 =
        await personnalisationService.getPersonnalisationConsequences(
          caePersonnalisationRegles,
          reponsesCas3,
          epciInfo
        );

      const scoresMapCas3 = referentielsScoringService.computeScoreMap(
        caeReferentiel,
        personnalisationConsequencesCas3,
        actionStatutsCas3,
        3
      );

      expect(scoresMapCas3['cae_1.2.3'].pointFait).toEqual(2.25);
      expect(scoresMapCas3['cae_3.3.5'].pointFait).toEqual(0);
      expect(scoresMapCas3['cae_3.3.5'].pointPotentiel).toEqual(2.0);

      /**
       Cas 4 :  Si EPCI et non concernée à la 3.3.5, la règle n'a pas de conséquence
      */

      const actionStatutsCas4: ActionStatutsByActionId = {};
      for (let i = 1; i < 7; i++) {
        actionStatutsCas4[`cae_3.3.5.1.${i}`] = {
          concerne: false,
          avancement: 'detaille',
          avancementDetaille: [0, 0, 0],
        };
      }
      for (let i = 1; i < 10; i++) {
        actionStatutsCas4[`cae_3.3.5.2.${i}`] = {
          concerne: false,
          avancement: 'detaille',
          avancementDetaille: [0, 0, 0],
        };
      }
      for (let i = 1; i < 5; i++) {
        actionStatutsCas4[`cae_3.3.5.3.${i}`] = {
          concerne: false,
          avancement: 'detaille',
          avancementDetaille: [0, 0, 0],
        };
      }

      const reponsesCas4: PersonnalisationReponsesPayload = {
        dechets_2: false,
        dechets_4: 0.1,
      };
      const personnalisationConsequencesCas4 =
        await personnalisationService.getPersonnalisationConsequences(
          caePersonnalisationRegles,
          reponsesCas4,
          epciInfo
        );

      const scoresMapCas4 = referentielsScoringService.computeScoreMap(
        caeReferentiel,
        personnalisationConsequencesCas4,
        actionStatutsCas4,
        3
      );

      expect(scoresMapCas4['cae_3.3.5'].concerne).toEqual(false);
      expect(scoresMapCas4['cae_3.3.5'].pointPotentiel).toEqual(0);
    });
  });

  describe('getScoreDiff', () => {
    it('python rounding issue', async () => {
      const scoreDiff = referentielsScoringService.getScoreDiff(
        {
          actionId: 'cae_6.5.1.2.8',
          explication: 'test explication',
          pointReferentiel: 0.338,
          pointPotentiel: 0.338,
          pointPotentielPerso: null,
          pointFait: 0,
          pointPasFait: 0,
          pointNonRenseigne: 0.338,
          pointProgramme: 0,
          concerne: true,
          completedTachesCount: 0,
          totalTachesCount: 1,
          faitTachesAvancement: 0,
          programmeTachesAvancement: 0,
          pasFaitTachesAvancement: 0,
          pasConcerneTachesAvancement: 0,
          desactive: false,
          renseigne: false,
        },
        {
          concerne: true,
          actionId: 'cae_6.5.1.2.8',
          desactive: false,
          renseigne: false,
          pointFait: 0,
          pointPasFait: 0,
          pointPotentiel: 0.337,
          pointProgramme: 0,
          pointReferentiel: 0.338,
          totalTachesCount: 1,
          pointNonRenseigne: 0.337,
          pointPotentielPerso: null,
          completedTachesCount: 0,
          faitTachesAvancement: 0,
          pasFaitTachesAvancement: 0,
          programmeTachesAvancement: 0,
          pasConcerneTachesAvancement: 0,
        }
      );
      // Even if the difference is 0.001, it should not be considered as a difference because due to python issue
      expect(scoreDiff).toEqual(null);
    });

    it('python rounding issue 2', async () => {
      const scoreDiff = referentielsScoringService.getScoreDiff(
        {
          actionId: 'eci',
          pointReferentiel: 500,
          pointPotentiel: 500,
          pointPotentielPerso: null,
          pointFait: 281.139,
          pointPasFait: 114.42,
          pointNonRenseigne: 0,
          pointProgramme: 104.44,
          concerne: true,
          completedTachesCount: 274,
          totalTachesCount: 274,
          faitTachesAvancement: 155.4,
          programmeTachesAvancement: 61.3,
          pasFaitTachesAvancement: 51.3,
          pasConcerneTachesAvancement: 6,
          desactive: false,
          renseigne: true,
          etoiles: 3,
        },
        {
          concerne: true,
          actionId: 'eci',
          desactive: false,
          renseigne: true,
          pointFait: 281.139,
          pointPasFait: 114.42,
          pointPotentiel: 500,
          pointProgramme: 104.44,
          pointReferentiel: 500,
          totalTachesCount: 274,
          pointNonRenseigne: 0,
          pointPotentielPerso: null,
          completedTachesCount: 274,
          faitTachesAvancement: 155.4,
          pasFaitTachesAvancement: 51.3,
          programmeTachesAvancement: 61.300000000000004,
          pasConcerneTachesAvancement: 6,
        }
      );
      // Small difference for programmeTachesAvancement
      expect(scoreDiff).toEqual(null);
    });

    it('Nominal difference', async () => {
      const scoreDiff = referentielsScoringService.getScoreDiff(
        {
          actionId: 'eci',
          pointReferentiel: 500,
          pointPotentiel: 500,
          pointPotentielPerso: null,
          pointFait: 242.925,
          pointPasFait: 102.42,
          pointNonRenseigne: 0,
          pointProgramme: 94.155,
          concerne: true,
          completedTachesCount: 274,
          totalTachesCount: 274,
          faitTachesAvancement: 138.9,
          programmeTachesAvancement: 54.8,
          pasFaitTachesAvancement: 42.3,
          pasConcerneTachesAvancement: 6,
          desactive: false,
          renseigne: true,
          etoiles: 2,
        },
        {
          concerne: true,
          actionId: 'eci',
          desactive: false,
          renseigne: true,
          pointFait: 281.139,
          pointPasFait: 114.42,
          pointPotentiel: 500,
          pointProgramme: 104.44,
          pointReferentiel: 500,
          totalTachesCount: 274,
          pointNonRenseigne: 0,
          pointPotentielPerso: null,
          completedTachesCount: 274,
          faitTachesAvancement: 155.4,
          pasFaitTachesAvancement: 51.3,
          programmeTachesAvancement: 61.300000000000004,
          pasConcerneTachesAvancement: 6,
        }
      );
      const expectedScoreDiff = {
        sauvegarde: {
          pointFait: 281.139,
          pointPasFait: 114.42,
          pointProgramme: 104.44,
          faitTachesAvancement: 155.4,
          programmeTachesAvancement: 61.300000000000004,
          pasFaitTachesAvancement: 51.3,
        },
        calcule: {
          pointFait: 242.925,
          pointPasFait: 102.42,
          pointProgramme: 94.155,
          faitTachesAvancement: 138.9,
          programmeTachesAvancement: 54.8,
          pasFaitTachesAvancement: 42.3,
        },
      };
      expect(scoreDiff).toEqual(expectedScoreDiff);
    });

    it('Concerne difference due to python code', async () => {
      const scoreDiff = referentielsScoringService.getScoreDiff(
        {
          actionId: 'cae_6.2.3.4.3',
          pointReferentiel: 0.667,
          pointPotentiel: 0,
          pointPotentielPerso: null,
          pointFait: 0,
          pointPasFait: 0,
          pointNonRenseigne: 0,
          pointProgramme: 0,
          concerne: false,
          completedTachesCount: 1,
          totalTachesCount: 1,
          faitTachesAvancement: 0,
          programmeTachesAvancement: 0,
          pasFaitTachesAvancement: 0,
          pasConcerneTachesAvancement: 1,
          desactive: false,
          renseigne: true,
        },
        {
          concerne: true,
          actionId: 'cae_6.2.3.4.3',
          desactive: false,
          renseigne: true,
          pointFait: 0,
          pointPasFait: 0,
          pointPotentiel: 0,
          pointProgramme: 0,
          pointReferentiel: 0.667,
          totalTachesCount: 1,
          pointNonRenseigne: 0,
          pointPotentielPerso: null,
          completedTachesCount: 0,
          faitTachesAvancement: 0,
          pasFaitTachesAvancement: 0,
          programmeTachesAvancement: 0,
          pasConcerneTachesAvancement: 0,
        },
        {
          'cae_6.2.3.4': {
            actionId: 'cae_6.2.3.4',
            pointReferentiel: 2,
            pointPotentiel: 0,
            pointPotentielPerso: null,
            pointFait: 0,
            pointPasFait: 0,
            pointNonRenseigne: 0,
            pointProgramme: 0,
            concerne: false,
            completedTachesCount: 3,
            totalTachesCount: 3,
            faitTachesAvancement: 0,
            programmeTachesAvancement: 0,
            pasFaitTachesAvancement: 0,
            pasConcerneTachesAvancement: 3,
            desactive: false,
            renseigne: true,
          },
        }
      );

      expect(scoreDiff).toEqual(null);
    });
  });
});
