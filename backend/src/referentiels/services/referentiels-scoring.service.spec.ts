import { Test } from '@nestjs/testing';
import { AuthService } from '../../auth/services/auth.service';
import {
  CollectiviteTypeEnum,
  IdentiteCollectivite,
} from '../../collectivites/models/collectivite.models';
import CollectivitesService from '../../collectivites/services/collectivites.service';
import DatabaseService from '../../common/services/database.service';
import { roundTo } from '../../common/services/number.helper';
import { GetPersonnalitionConsequencesResponseType } from '../../personnalisations/models/get-personnalisation-consequences.response';
import { GetPersonnalisationReponsesResponseType } from '../../personnalisations/models/get-personnalisation-reponses.response';
import { caePersonnalisationRegles } from '../../personnalisations/models/samples/cae-personnalisation-regles.sample';
import ExpressionParserService from '../../personnalisations/services/expression-parser.service';
import PersonnalisationsService from '../../personnalisations/services/personnalisations-service';
import { GetActionStatutsResponseType } from '../models/get-action-statuts.response';
import { caeReferentiel } from '../models/samples/cae-referentiel';
import { deeperReferentiel } from '../models/samples/deeper-referentiel';
import { eciReferentiel } from '../models/samples/eci-referentiel';
import { simpleReferentiel } from '../models/samples/simple-referentiel';
import ReferentielsScoringService from './referentiels-scoring.service';
import ReferentielsService from './referentiels.service';

describe('ReferentielsScoringService', () => {
  let referentielsScoringService: ReferentielsScoringService;
  let personnalisationService: PersonnalisationsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReferentielsScoringService,
        PersonnalisationsService,
        ExpressionParserService,
      ],
    })
      .useMocker((token) => {
        if (
          token === DatabaseService ||
          token === AuthService ||
          token === ReferentielsService ||
          token === CollectivitesService
        ) {
          return {};
        }
      })
      .compile();

    referentielsScoringService = moduleRef.get(ReferentielsScoringService);
    personnalisationService = moduleRef.get(PersonnalisationsService);
  });

  describe('computeScoreMap', () => {
    it('notation_when_one_tache_is_fait', async () => {
      const personnalisationConsequences: GetPersonnalitionConsequencesResponseType =
        {};
      const actionStatuts: GetActionStatutsResponseType = {
        'eci_1.1': {
          concerne: true,
          avancement: 'fait',
          avancement_detaille: [1, 0, 0],
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
        action_id: 'eci_1.1',
        point_fait: 10,
        point_programme: 0.0,
        point_pas_fait: 0.0,
        point_non_renseigne: 0.0,
        point_potentiel: 10,
        point_referentiel: 10,
        concerne: true,
        total_taches_count: 1,
        completed_taches_count: 1,
        fait_taches_avancement: 1,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: true,
      });

      expect(scoresMap['eci_1']).toEqual({
        action_id: 'eci_1',
        point_fait: 10,
        point_programme: 0.0,
        point_pas_fait: 0.0,
        point_non_renseigne: 20,
        point_potentiel: 30,
        point_referentiel: 30,
        concerne: true,
        total_taches_count: 2,
        completed_taches_count: 1,
        fait_taches_avancement: 1,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: false,
      });

      expect(scoresMap['eci_2']).toEqual({
        action_id: 'eci_2',
        point_fait: 0,
        point_programme: 0.0,
        point_pas_fait: 0.0,
        point_non_renseigne: 70,
        point_potentiel: 70,
        point_referentiel: 70,
        concerne: true,
        total_taches_count: 3,
        completed_taches_count: 0,
        fait_taches_avancement: 0,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: false,
      });

      expect(scoresMap['eci']).toEqual({
        action_id: 'eci',
        point_fait: 10,
        point_programme: 0.0,
        point_pas_fait: 0.0,
        point_non_renseigne: 90,
        point_potentiel: 100,
        point_referentiel: 100,
        concerne: true,
        total_taches_count: 5,
        completed_taches_count: 1,
        fait_taches_avancement: 1,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: false,
      });
    });

    it('notation_when_one_tache_is_fait_avancement_detaille_non_renseigne', async () => {
      const personnalisationConsequences: GetPersonnalitionConsequencesResponseType =
        {};
      const actionStatuts: GetActionStatutsResponseType = {
        'eci_1.1': {
          concerne: true,
          avancement: 'fait',
          avancement_detaille: null,
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
        action_id: 'eci_1.1',
        point_fait: 10,
        point_programme: 0.0,
        point_pas_fait: 0.0,
        point_non_renseigne: 0.0,
        point_potentiel: 10,
        point_referentiel: 10,
        concerne: true,
        total_taches_count: 1,
        completed_taches_count: 1,
        fait_taches_avancement: 1,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: true,
      });

      expect(scoresMap['eci_1']).toEqual({
        action_id: 'eci_1',
        point_fait: 10,
        point_programme: 0.0,
        point_pas_fait: 0.0,
        point_non_renseigne: 20,
        point_potentiel: 30,
        point_referentiel: 30,
        concerne: true,
        total_taches_count: 2,
        completed_taches_count: 1,
        fait_taches_avancement: 1,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: false,
      });

      expect(scoresMap['eci_2']).toEqual({
        action_id: 'eci_2',
        point_fait: 0,
        point_programme: 0.0,
        point_pas_fait: 0.0,
        point_non_renseigne: 70,
        point_potentiel: 70,
        point_referentiel: 70,
        concerne: true,
        total_taches_count: 3,
        completed_taches_count: 0,
        fait_taches_avancement: 0,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: false,
      });

      expect(scoresMap['eci']).toEqual({
        action_id: 'eci',
        point_fait: 10,
        point_programme: 0.0,
        point_pas_fait: 0.0,
        point_non_renseigne: 90,
        point_potentiel: 100,
        point_referentiel: 100,
        concerne: true,
        total_taches_count: 5,
        completed_taches_count: 1,
        fait_taches_avancement: 1,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: false,
      });
    });

    it('notation_when_one_tache_is_programme', async () => {
      const personnalisationConsequences: GetPersonnalitionConsequencesResponseType =
        {};
      const actionStatuts: GetActionStatutsResponseType = {
        'eci_1.1': {
          concerne: true,
          avancement: 'programme',
          avancement_detaille: [0, 1, 0],
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
        action_id: 'eci_1.1',
        point_fait: 0,
        point_programme: 10,
        point_pas_fait: 0.0,
        point_non_renseigne: 0.0,
        point_potentiel: 10,
        point_referentiel: 10,
        concerne: true,
        total_taches_count: 1,
        completed_taches_count: 1,
        fait_taches_avancement: 0,
        programme_taches_avancement: 1,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: true,
      });

      expect(scoresMap['eci_1']).toEqual({
        action_id: 'eci_1',
        point_fait: 0,
        point_programme: 10,
        point_pas_fait: 0.0,
        point_non_renseigne: 20,
        point_potentiel: 30,
        point_referentiel: 30,
        concerne: true,
        total_taches_count: 2,
        completed_taches_count: 1,
        fait_taches_avancement: 0,
        programme_taches_avancement: 1,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: false,
      });

      expect(scoresMap['eci_2']).toEqual({
        action_id: 'eci_2',
        point_fait: 0,
        point_programme: 0.0,
        point_pas_fait: 0.0,
        point_non_renseigne: 70,
        point_potentiel: 70,
        point_referentiel: 70,
        concerne: true,
        total_taches_count: 3,
        completed_taches_count: 0,
        fait_taches_avancement: 0,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: false,
      });

      expect(scoresMap['eci']).toEqual({
        action_id: 'eci',
        point_fait: 0,
        point_programme: 10,
        point_pas_fait: 0.0,
        point_non_renseigne: 90,
        point_potentiel: 100,
        point_referentiel: 100,
        concerne: true,
        total_taches_count: 5,
        completed_taches_count: 1,
        fait_taches_avancement: 0,
        programme_taches_avancement: 1,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: false,
      });
    });

    it('notation_when_one_tache_is_pas_fait', async () => {
      const personnalisationConsequences: GetPersonnalitionConsequencesResponseType =
        {};
      const actionStatuts: GetActionStatutsResponseType = {
        'eci_1.1': {
          concerne: true,
          avancement: 'pas_fait',
          avancement_detaille: [0, 0, 1],
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
        action_id: 'eci_1.1',
        point_fait: 0,
        point_programme: 0,
        point_pas_fait: 10.0,
        point_non_renseigne: 0.0,
        point_potentiel: 10,
        point_referentiel: 10,
        concerne: true,
        total_taches_count: 1,
        completed_taches_count: 1,
        fait_taches_avancement: 0,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 1,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: true,
      });

      expect(scoresMap['eci_1']).toEqual({
        action_id: 'eci_1',
        point_fait: 0,
        point_programme: 0,
        point_pas_fait: 10,
        point_non_renseigne: 20,
        point_potentiel: 30,
        point_referentiel: 30,
        concerne: true,
        total_taches_count: 2,
        completed_taches_count: 1,
        fait_taches_avancement: 0,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 1,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: false,
      });

      expect(scoresMap['eci_2']).toEqual({
        action_id: 'eci_2',
        point_fait: 0,
        point_programme: 0.0,
        point_pas_fait: 0.0,
        point_non_renseigne: 70,
        point_potentiel: 70,
        point_referentiel: 70,
        concerne: true,
        total_taches_count: 3,
        completed_taches_count: 0,
        fait_taches_avancement: 0,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: false,
      });

      expect(scoresMap['eci']).toEqual({
        action_id: 'eci',
        point_fait: 0,
        point_programme: 0,
        point_pas_fait: 10,
        point_non_renseigne: 90,
        point_potentiel: 100,
        point_referentiel: 100,
        concerne: true,
        total_taches_count: 5,
        completed_taches_count: 1,
        fait_taches_avancement: 0,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 1,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: false,
      });
    });

    it('notation_when_one_tache_has_detailed_avancement', async () => {
      const personnalisationConsequences: GetPersonnalitionConsequencesResponseType =
        {};
      const actionStatuts: GetActionStatutsResponseType = {
        'eci_1.1': {
          concerne: true,
          avancement: 'detaille',
          avancement_detaille: [0.2, 0.7, 0.1],
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
        action_id: 'eci_1.1',
        point_fait: 2,
        point_programme: 7,
        point_pas_fait: 1,
        point_non_renseigne: 0.0,
        point_potentiel: 10,
        point_referentiel: 10,
        concerne: true,
        total_taches_count: 1,
        completed_taches_count: 1,
        fait_taches_avancement: 0.2,
        programme_taches_avancement: 0.7,
        pas_fait_taches_avancement: 0.1,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: true,
      });

      expect(scoresMap['eci_1']).toEqual({
        action_id: 'eci_1',
        point_fait: 2,
        point_programme: 7,
        point_pas_fait: 1,
        point_non_renseigne: 20,
        point_potentiel: 30,
        point_referentiel: 30,
        concerne: true,
        total_taches_count: 2,
        completed_taches_count: 1,
        fait_taches_avancement: 0.2,
        programme_taches_avancement: 0.7,
        pas_fait_taches_avancement: 0.1,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: false,
      });

      expect(scoresMap['eci_2']).toEqual({
        action_id: 'eci_2',
        point_fait: 0,
        point_programme: 0.0,
        point_pas_fait: 0.0,
        point_non_renseigne: 70,
        point_potentiel: 70,
        point_referentiel: 70,
        concerne: true,
        total_taches_count: 3,
        completed_taches_count: 0,
        fait_taches_avancement: 0,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: false,
      });

      expect(scoresMap['eci']).toEqual({
        action_id: 'eci',
        point_fait: 2,
        point_programme: 7,
        point_pas_fait: 1,
        point_non_renseigne: 90,
        point_potentiel: 100,
        point_referentiel: 100,
        concerne: true,
        total_taches_count: 5,
        completed_taches_count: 1,
        fait_taches_avancement: 0.2,
        programme_taches_avancement: 0.7,
        pas_fait_taches_avancement: 0.1,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: false,
      });
    });

    it('notation_when_one_tache_is_non_concerne', async () => {
      const personnalisationConsequences: GetPersonnalitionConsequencesResponseType =
        {};
      const actionStatuts: GetActionStatutsResponseType = {
        'eci_1.1': {
          concerne: false,
          avancement: 'non_renseigne',
          avancement_detaille: null,
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
        action_id: 'eci_1.1',
        point_fait: 0,
        point_programme: 0,
        point_pas_fait: 0,
        point_non_renseigne: 0.0,
        point_potentiel: 0,
        point_referentiel: 10,
        concerne: false,
        total_taches_count: 1,
        completed_taches_count: 1,
        fait_taches_avancement: 0,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 1,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: true,
      });

      // Redistribution des points
      expect(scoresMap['eci_1.2']).toEqual({
        action_id: 'eci_1.2',
        point_fait: 0,
        point_programme: 0,
        point_pas_fait: 0,
        point_non_renseigne: 30,
        point_potentiel: 30,
        point_referentiel: 20,
        concerne: true,
        total_taches_count: 1,
        completed_taches_count: 0,
        fait_taches_avancement: 0,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: false,
      });

      expect(scoresMap['eci_1']).toEqual({
        action_id: 'eci_1',
        point_fait: 0,
        point_programme: 0,
        point_pas_fait: 0,
        point_non_renseigne: 30,
        point_potentiel: 30,
        point_referentiel: 30,
        concerne: true,
        total_taches_count: 2,
        completed_taches_count: 1,
        fait_taches_avancement: 0,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 1,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: false,
      });

      expect(scoresMap['eci_2']).toEqual({
        action_id: 'eci_2',
        point_fait: 0,
        point_programme: 0.0,
        point_pas_fait: 0.0,
        point_non_renseigne: 70,
        point_potentiel: 70,
        point_referentiel: 70,
        concerne: true,
        total_taches_count: 3,
        completed_taches_count: 0,
        fait_taches_avancement: 0,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: false,
      });

      expect(scoresMap['eci']).toEqual({
        action_id: 'eci',
        point_fait: 0,
        point_programme: 0,
        point_pas_fait: 0,
        point_non_renseigne: 100,
        point_potentiel: 100,
        point_referentiel: 100,
        concerne: true,
        total_taches_count: 5,
        completed_taches_count: 1,
        fait_taches_avancement: 0,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 1,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: false,
      });
    });

    it('notation_when_an_action_of_action_level_becomes_non_concernee', async () => {
      const personnalisationConsequences: GetPersonnalitionConsequencesResponseType =
        {};
      const actionStatuts: GetActionStatutsResponseType = {
        'eci_1.1': {
          concerne: false,
          avancement: 'non_renseigne',
          avancement_detaille: null,
        },
        'eci_1.2': {
          concerne: false,
          avancement: 'non_renseigne',
          avancement_detaille: null,
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
        action_id: 'eci_1.1',
        point_fait: 0,
        point_programme: 0,
        point_pas_fait: 0,
        point_non_renseigne: 0.0,
        point_potentiel: 0,
        point_referentiel: 10,
        concerne: false,
        total_taches_count: 1,
        completed_taches_count: 1,
        fait_taches_avancement: 0,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 1,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: true,
      });

      expect(scoresMap['eci_1.2']).toEqual({
        action_id: 'eci_1.2',
        point_fait: 0,
        point_programme: 0,
        point_pas_fait: 0,
        point_non_renseigne: 0,
        point_potentiel: 0,
        point_referentiel: 20,
        concerne: false,
        total_taches_count: 1,
        completed_taches_count: 1,
        fait_taches_avancement: 0,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 1,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: true,
      });

      expect(scoresMap['eci_1']).toEqual({
        action_id: 'eci_1',
        point_fait: 0,
        point_programme: 0,
        point_pas_fait: 0,
        point_non_renseigne: 0,
        point_potentiel: 0,
        point_referentiel: 30,
        concerne: false,
        total_taches_count: 2,
        completed_taches_count: 2,
        fait_taches_avancement: 0,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 2,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: true,
      });

      expect(scoresMap['eci_2']).toEqual({
        action_id: 'eci_2',
        point_fait: 0,
        point_programme: 0.0,
        point_pas_fait: 0.0,
        point_non_renseigne: 70,
        point_potentiel: 70,
        point_referentiel: 70,
        concerne: true,
        total_taches_count: 3,
        completed_taches_count: 0,
        fait_taches_avancement: 0,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: false,
      });

      expect(scoresMap['eci']).toEqual({
        action_id: 'eci',
        point_fait: 0,
        point_programme: 0,
        point_pas_fait: 0,
        point_non_renseigne: 70,
        point_potentiel: 70,
        point_referentiel: 100,
        concerne: true,
        total_taches_count: 5,
        completed_taches_count: 2,
        fait_taches_avancement: 0,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 2,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: false,
      });
    });

    it('notation_should_not_redistribute_points_on_taches_reglementaires', async () => {
      const personnalisationConsequences: GetPersonnalitionConsequencesResponseType =
        {};
      const actionStatuts: GetActionStatutsResponseType = {
        'eci_2.1': {
          concerne: false,
          avancement: 'non_renseigne',
          avancement_detaille: null,
        },
        'eci_2.2': {
          concerne: true,
          avancement: 'fait',
          avancement_detaille: [1, 0, 0],
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
        action_id: 'eci_2.0',
        point_fait: 0,
        point_programme: 0,
        point_pas_fait: 0,
        point_non_renseigne: 0.0,
        point_potentiel: 0,
        point_referentiel: 0,
        concerne: true,
        total_taches_count: 1,
        completed_taches_count: 0,
        fait_taches_avancement: 0,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: false, // WARNING: in python code, it is true but seems to be a mistake
      });

      // Désactivé donc point potentiel à 0
      expect(scoresMap['eci_2.1']).toEqual({
        action_id: 'eci_2.1',
        point_fait: 0,
        point_programme: 0,
        point_pas_fait: 0,
        point_non_renseigne: 0,
        point_potentiel: 0,
        point_referentiel: 65,
        concerne: false,
        total_taches_count: 1,
        completed_taches_count: 1,
        fait_taches_avancement: 0,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 1,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: true,
      });

      // Points de eci_2.1 sont redistribués sur eci_2.2
      expect(scoresMap['eci_2.2']).toEqual({
        action_id: 'eci_2.2',
        point_fait: 70,
        point_programme: 0,
        point_pas_fait: 0,
        point_non_renseigne: 0,
        point_potentiel: 70,
        point_referentiel: 5,
        concerne: true,
        total_taches_count: 1,
        completed_taches_count: 1,
        fait_taches_avancement: 1,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: true,
      });

      expect(scoresMap['eci_2']).toEqual({
        action_id: 'eci_2',
        point_fait: 70,
        point_programme: 0.0,
        point_pas_fait: 0.0,
        point_non_renseigne: 0,
        point_potentiel: 70,
        point_referentiel: 70,
        concerne: true,
        total_taches_count: 3,
        completed_taches_count: 2,
        fait_taches_avancement: 1,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 1,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: true,
      });

      expect(scoresMap['eci']).toEqual({
        action_id: 'eci',
        point_fait: 70,
        point_programme: 0,
        point_pas_fait: 0,
        point_non_renseigne: 30,
        point_potentiel: 100,
        point_referentiel: 100,
        concerne: true,
        total_taches_count: 5,
        completed_taches_count: 2,
        fait_taches_avancement: 1,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 1,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: false,
      });
    });

    it('notation_should_redistribute_non_concernee_points_if_depth_is_greater_than_action_depth', async () => {
      const personnalisationConsequences: GetPersonnalitionConsequencesResponseType =
        {};

      const actionStatuts: GetActionStatutsResponseType = {
        'eci_2.2.1': {
          concerne: false,
          avancement: 'non_renseigne',
          avancement_detaille: null,
        },
        'eci_2.2.2': {
          concerne: false,
          avancement: 'non_renseigne',
          avancement_detaille: null,
        },
        'eci_2.2.3': {
          concerne: false,
          avancement: 'non_renseigne',
          avancement_detaille: null,
        },
        'eci_1.1': {
          concerne: true,
          avancement: 'programme',
          avancement_detaille: [0, 1, 0],
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
        action_id: 'eci_2.2',
        point_fait: 0,
        point_programme: 0,
        point_pas_fait: 0,
        point_non_renseigne: 0,
        point_potentiel: 0,
        point_referentiel: 5,
        completed_taches_count: 3,
        total_taches_count: 3,
        fait_taches_avancement: 0,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 3,
        concerne: false,
        point_potentiel_perso: null,
        desactive: false,
        renseigne: true,
      });

      // point_referentiel of 2.2 is redistributed on 2.1
      expect(scoresMap['eci_2.1']).toEqual({
        action_id: 'eci_2.1',
        point_fait: 0,
        point_programme: 0,
        point_pas_fait: 0,
        point_non_renseigne: 70,
        point_potentiel: 70,
        point_referentiel: 65,
        completed_taches_count: 0,
        total_taches_count: 3,
        fait_taches_avancement: 0,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        concerne: true,
        point_potentiel_perso: null,
        desactive: false,
        renseigne: false,
      });

      expect(scoresMap['eci_2.1.0']).toEqual({
        action_id: 'eci_2.1.0',
        point_fait: 0,
        point_programme: 0,
        point_pas_fait: 0,
        point_non_renseigne: 0,
        point_potentiel: 0,
        point_referentiel: 0,
        completed_taches_count: 0,
        total_taches_count: 1,
        fait_taches_avancement: 0,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        concerne: true,
        point_potentiel_perso: null,
        desactive: false,
        renseigne: false,
      });

      expect(scoresMap['eci_2.1.1']).toEqual({
        action_id: 'eci_2.1.1',
        point_fait: 0,
        point_programme: 0,
        point_pas_fait: 0,
        point_non_renseigne: roundTo((40 / 65) * 70, 3),
        point_potentiel: roundTo((40 / 65) * 70, 3),
        point_referentiel: 40,
        completed_taches_count: 0,
        total_taches_count: 1,
        fait_taches_avancement: 0,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        concerne: true,
        point_potentiel_perso: null,
        desactive: false,
        renseigne: false,
      });

      expect(scoresMap['eci_2.1.2']).toEqual({
        action_id: 'eci_2.1.2',
        point_fait: 0,
        point_programme: 0,
        point_pas_fait: 0,
        point_non_renseigne: roundTo((25 / 65) * 70, 3),
        point_potentiel: roundTo((25 / 65) * 70, 3),
        point_referentiel: 25,
        completed_taches_count: 0,
        total_taches_count: 1,
        fait_taches_avancement: 0,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        concerne: true,
        point_potentiel_perso: null,
        desactive: false,
        renseigne: false,
      });

      // axe 2 point_fait should remain unchanged
      expect(scoresMap['eci_2']).toEqual({
        action_id: 'eci_2',
        point_fait: 0,
        point_pas_fait: 0,
        point_programme: 0,
        point_non_renseigne: 70,
        point_potentiel: 70,
        point_referentiel: 70,
        completed_taches_count: 3,
        total_taches_count: 7,
        fait_taches_avancement: 0,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 3,
        concerne: true,
        point_potentiel_perso: null,
        desactive: false,
        renseigne: false,
      });

      // root point_fait should remain unchanged
      expect(scoresMap['eci']).toEqual({
        action_id: 'eci',
        point_fait: 0,
        point_programme: 10,
        point_pas_fait: 0,
        point_non_renseigne: 90,
        point_potentiel: 100,
        point_referentiel: 100,
        completed_taches_count: 4,
        total_taches_count: 9,
        fait_taches_avancement: 0,
        programme_taches_avancement: 1,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 3,
        concerne: true,
        point_potentiel_perso: null,
        desactive: false,
        renseigne: false,
      });
    });

    it('notation_when_one_action_is_desactivee', async () => {
      const personnalisationConsequences: GetPersonnalitionConsequencesResponseType =
        {
          eci_1: {
            desactive: true,
            score_formule: null,
            potentiel_perso: null,
          },
        };
      const actionStatuts: GetActionStatutsResponseType = {
        'eci_2.2': {
          concerne: true,
          avancement: 'fait',
          avancement_detaille: [1, 0, 0],
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
      expect(scoresMap['eci_1'].point_potentiel_perso).toEqual(null);
      // Point potentiel is impacted by desactivation
      expect(scoresMap['eci_1'].point_potentiel).toEqual(0);
      // Point referentiel is not impacted by desactivation
      expect(scoresMap['eci_1'].point_referentiel).toEqual(30);

      // Consequences on action children should affect point_potentiel (reduced to 0) but not point_potentiel_perso that is null
      expect(scoresMap['eci_1.1'].desactive).toEqual(true);
      expect(scoresMap['eci_1.1'].point_potentiel_perso).toEqual(null);
      // Point potentiel is impacted by desactivation
      expect(scoresMap['eci_1.1'].point_potentiel).toEqual(0);
      // Point referentiel is not impacted by desactivation
      expect(scoresMap['eci_1.1'].point_referentiel).toEqual(10);
      expect(scoresMap['eci_1.2'].desactive).toEqual(true);
      expect(scoresMap['eci_1.2'].point_potentiel_perso).toEqual(null);
      // Point potentiel is impacted by desactivation
      expect(scoresMap['eci_1.2'].point_potentiel).toEqual(0);
      // Point referentiel is not impacted by desactivation
      expect(scoresMap['eci_1.2'].point_referentiel).toEqual(20);

      // Consequences should also affect action parent potentiel points
      expect(scoresMap['eci'].point_potentiel).toEqual(70);
      // Consequences should not affect parent point referentiel, desactive and point_potentiel_perso
      expect(scoresMap['eci'].desactive).toEqual(false);
      expect(scoresMap['eci'].point_potentiel_perso).toEqual(null);
      expect(scoresMap['eci'].point_referentiel).toEqual(100);

      // Check scores are still calculated correctly
      expect(scoresMap['eci'].point_fait).toEqual(5);
      expect(scoresMap['eci_2.2'].point_fait).toEqual(5);
    });

    it('notation_when_one_action_is_reduced', async () => {
      const personnalisationConsequences: GetPersonnalitionConsequencesResponseType =
        {
          eci_1: {
            desactive: null,
            score_formule: null,
            potentiel_perso: 0.2, // Action eci_1 officially worse 30 points, so will be reduced to 6 points
          },
        };
      const actionStatuts: GetActionStatutsResponseType = {
        'eci_1.1': {
          concerne: true,
          avancement: 'fait',
          avancement_detaille: [1, 0, 0],
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
        action_id: 'eci_1.1',
        point_fait: 2.0,
        point_programme: 0.0,
        point_pas_fait: 0.0,
        point_non_renseigne: 0.0,
        point_potentiel: 2.0,
        point_referentiel: 10,
        concerne: true,
        total_taches_count: 1,
        completed_taches_count: 1,
        fait_taches_avancement: 1,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: true,
      });

      expect(scoresMap['eci_1.2']).toEqual({
        action_id: 'eci_1.2',
        point_fait: 0.0,
        point_programme: 0.0,
        point_pas_fait: 0.0,
        point_non_renseigne: 4.0,
        point_potentiel: 4.0,
        point_referentiel: 20,
        concerne: true,
        total_taches_count: 1,
        completed_taches_count: 0,
        fait_taches_avancement: 0,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: false,
      });

      expect(scoresMap['eci_1']).toEqual({
        action_id: 'eci_1',
        point_fait: 2.0,
        point_programme: 0.0,
        point_pas_fait: 0.0,
        point_non_renseigne: 4.0,
        point_potentiel: 6.0,
        point_referentiel: 30,
        concerne: true,
        total_taches_count: 2,
        completed_taches_count: 1,
        fait_taches_avancement: 1,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: 6.0,
        renseigne: false,
      });

      expect(scoresMap['eci']).toEqual({
        action_id: 'eci',
        point_fait: 2.0,
        point_programme: 0.0,
        point_pas_fait: 0.0,
        point_non_renseigne: 74.0,
        point_potentiel: 76.0,
        point_referentiel: 100,
        concerne: true,
        total_taches_count: 5,
        completed_taches_count: 1,
        fait_taches_avancement: 1,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: false,
      });
    });

    it('notation_when_one_action_is_increased', async () => {
      const personnalisationConsequences: GetPersonnalitionConsequencesResponseType =
        {
          eci_1: {
            desactive: null,
            score_formule: null,
            potentiel_perso: 1.2, // Action eci_1 officially worse 30 points, so will be increased to 36 points
          },
        };
      const actionStatuts: GetActionStatutsResponseType = {
        'eci_1.1': {
          concerne: true,
          avancement: 'fait',
          avancement_detaille: [1, 0, 0],
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
        action_id: 'eci_1.1',
        point_fait: 12.0,
        point_programme: 0.0,
        point_pas_fait: 0.0,
        point_non_renseigne: 0.0,
        point_potentiel: 12.0, // 10 * 1.2
        point_referentiel: 10,
        concerne: true,
        total_taches_count: 1,
        completed_taches_count: 1,
        fait_taches_avancement: 1,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: true,
      });

      expect(scoresMap['eci_1.2']).toEqual({
        action_id: 'eci_1.2',
        point_fait: 0.0,
        point_programme: 0.0,
        point_pas_fait: 0.0,
        point_non_renseigne: 24.0,
        point_potentiel: 24.0, // 20 * 1.2
        point_referentiel: 20,
        concerne: true,
        total_taches_count: 1,
        completed_taches_count: 0,
        fait_taches_avancement: 0,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: false,
      });

      expect(scoresMap['eci_1']).toEqual({
        action_id: 'eci_1',
        point_fait: 12.0,
        point_programme: 0.0,
        point_pas_fait: 0.0,
        point_non_renseigne: 24.0,
        point_potentiel: 36, //  (30 * 1.2)
        point_referentiel: 30,
        concerne: true,
        total_taches_count: 2,
        completed_taches_count: 1,
        fait_taches_avancement: 1,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: 36.0, // Consequence applied here ! (30 * 1.2)
        renseigne: false,
      });

      expect(scoresMap['eci']).toEqual({
        action_id: 'eci',
        point_fait: 12.0,
        point_programme: 0.0,
        point_pas_fait: 0.0,
        point_non_renseigne: 94.0,
        point_potentiel: 106.0, //  (70 from eci_2 and 36 from eci_1)
        point_referentiel: 100,
        concerne: true,
        total_taches_count: 5,
        completed_taches_count: 1,
        fait_taches_avancement: 1,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: false,
      });
    });

    it('notation_when_potentiel_perso_formule_is_given', async () => {
      const personnalisationConsequences: GetPersonnalitionConsequencesResponseType =
        {
          eci_1: {
            desactive: null,
            score_formule: 'min(score(eci_1), score(eci_2))',
            potentiel_perso: null,
          },
        };
      const actionStatuts: GetActionStatutsResponseType = {
        'eci_2.2': {
          concerne: true,
          avancement: 'fait',
          avancement_detaille: [1, 0, 0], // 5 points
        },
        'eci_1.1': {
          concerne: true,
          avancement: 'fait',
          avancement_detaille: [1, 0, 0], // 10 points
        },
        'eci_1.2': {
          concerne: true,
          avancement: 'fait',
          avancement_detaille: [1, 0, 0], // 20 points
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
        action_id: 'eci_2',
        point_fait: 5,
        point_programme: 0.0,
        point_pas_fait: 0.0,
        point_non_renseigne: 65,
        point_potentiel: 70,
        point_referentiel: 70,
        concerne: true,
        total_taches_count: 3,
        completed_taches_count: 1,
        fait_taches_avancement: 1,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 0,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: false,
      });

      expect(
        roundTo(
          scoresMap['eci_1'].point_fait! / scoresMap['eci_1'].point_potentiel!,
          5
        )
      ).toEqual(
        roundTo(
          scoresMap['eci_2'].point_fait! / scoresMap['eci_2'].point_potentiel!,
          5
        )
      );

      expect(scoresMap['eci_1'].point_fait).toEqual(2.143);
      expect(scoresMap['eci_1.1'].point_fait).toEqual(0.714);
      expect(scoresMap['eci_1.2'].point_fait).toEqual(1.429);
      expect(scoresMap['eci'].point_fait).toEqual(7.143);
    });

    it('eci_desactivation_of_sous_action_242_should_redistribute_points_amongst_siblings', async () => {
      const personnalisationConsequences: GetPersonnalitionConsequencesResponseType =
        {
          'eci_2.4.2': {
            desactive: true,
            score_formule: null,
            potentiel_perso: null,
          },
        };
      const actionStatuts: GetActionStatutsResponseType = {};

      const scoresMap = referentielsScoringService.computeScoreMap(
        eciReferentiel,
        personnalisationConsequences,
        actionStatuts,
        2
      );

      expect(scoresMap['eci_2.4.2']).toEqual({
        action_id: 'eci_2.4.2',
        point_fait: 0.0,
        point_programme: 0.0,
        point_pas_fait: 0.0,
        point_non_renseigne: 0.0,
        point_potentiel: 0.0,
        point_referentiel: 4,
        concerne: false,
        total_taches_count: 4,
        completed_taches_count: 4,
        fait_taches_avancement: 0,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 4,
        desactive: true,
        point_potentiel_perso: null,
        renseigne: true,
      });

      // Points correctement redistribués
      expect(scoresMap['eci_2.4.0'].point_potentiel).toEqual(0); // action réglementaire
      expect(scoresMap['eci_2.4.1'].point_potentiel).toEqual(5); // 4 + 1
      expect(scoresMap['eci_2.4.2'].point_potentiel).toEqual(0); // désactivé
      expect(scoresMap['eci_2.4.3'].point_potentiel).toEqual(3); // 2 + 1
      expect(scoresMap['eci_2.4.4'].point_potentiel).toEqual(7); // 6 + 1
      expect(scoresMap['eci_2.4.5'].point_potentiel).toEqual(5); // 4 + 1

      // Toujours 20 points pour eci_2.4
      expect(scoresMap['eci_2.4']).toEqual({
        action_id: 'eci_2.4',
        point_fait: 0.0,
        point_programme: 0.0,
        point_pas_fait: 0.0,
        point_non_renseigne: 20.0,
        point_potentiel: 20.0,
        point_referentiel: 20,
        concerne: true,
        total_taches_count: 17,
        completed_taches_count: 4,
        fait_taches_avancement: 0,
        programme_taches_avancement: 0,
        pas_fait_taches_avancement: 0,
        pas_concerne_taches_avancement: 4,
        desactive: false,
        point_potentiel_perso: null,
        renseigne: false,
      });
    });

    it('cae_321_when_recuperation_cogeneration_is_NON', async () => {
      const reponses: GetPersonnalisationReponsesResponseType = {
        recuperation_cogeneration: false,
      };
      const collectiviteInfo: IdentiteCollectivite = {
        type: CollectiviteTypeEnum.COMMUNE,
        soustype: null,
        population_tags: [],
        drom: false,
      };
      const personnalisationConsequences =
        await personnalisationService.getPersonnalisationConsequences(
          caePersonnalisationRegles,
          reponses,
          collectiviteInfo
        );

      const actionStatuts: GetActionStatutsResponseType = {};

      const scoresMap = referentielsScoringService.computeScoreMap(
        caeReferentiel,
        personnalisationConsequences,
        actionStatuts,
        3
      );

      // Si la récupération recuperation_cogeneration est NON, alors, cae_3.2.1.2 et cae_3.2.1.3 sont désactivées et cae_3.2.1.1 vaut 2 points
      expect(scoresMap['cae_3.2.1.2'].point_potentiel).toEqual(0);
      expect(scoresMap['cae_3.2.1.2'].desactive).toEqual(true);
      expect(scoresMap['cae_3.2.1.3'].concerne).toEqual(false);
      expect(scoresMap['cae_3.2.1.3'].point_potentiel).toEqual(0);
      expect(scoresMap['cae_3.2.1.3'].desactive).toEqual(true);
      expect(scoresMap['cae_3.2.1.3'].concerne).toEqual(false);

      expect(scoresMap['cae_3.2.1'].point_potentiel_perso).toEqual(2);
      expect(scoresMap['cae_3.2.1'].point_potentiel).toEqual(2);
      expect(scoresMap['cae_3.2.1.1'].point_potentiel).toEqual(2);
      expect(scoresMap['cae_3.2.1.1.1'].point_potentiel).toEqual(0.25);
    });

    it('cae_631_when_dev_eco_2_is_0', async () => {
      const reponses: GetPersonnalisationReponsesResponseType = {
        dev_eco_2: 0.0,
      };
      const collectiviteInfo: IdentiteCollectivite = {
        type: CollectiviteTypeEnum.COMMUNE,
        soustype: null,
        population_tags: [],
        drom: false,
      };
      const personnalisationConsequences =
        await personnalisationService.getPersonnalisationConsequences(
          caePersonnalisationRegles,
          reponses,
          collectiviteInfo
        );

      const actionStatuts: GetActionStatutsResponseType = {};

      const scoresMap = referentielsScoringService.computeScoreMap(
        caeReferentiel,
        personnalisationConsequences,
        actionStatuts,
        3
      );

      expect(scoresMap['cae_6.3.1'].point_potentiel).toEqual(2);
      expect(scoresMap['cae_6.3.1'].point_potentiel_perso).toEqual(2);
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

      const reponses: GetPersonnalisationReponsesResponseType = {
        dev_eco_4: false,
      };
      const collectiviteInfo: IdentiteCollectivite = {
        type: CollectiviteTypeEnum.COMMUNE,
        soustype: null,
        population_tags: [],
        drom: false,
      };
      const personnalisationConsequences =
        await personnalisationService.getPersonnalisationConsequences(
          caePersonnalisationRegles,
          reponses,
          collectiviteInfo
        );

      const actionStatuts: GetActionStatutsResponseType = {};

      const scoresMap = referentielsScoringService.computeScoreMap(
        caeReferentiel,
        personnalisationConsequences,
        actionStatuts,
        3
      );

      expect(scoresMap['cae_6.3.1.4'].desactive).toEqual(true);
      expect(scoresMap['cae_6.3.1.4'].point_potentiel).toEqual(0);
      expect(scoresMap['cae_6.3.1.4'].concerne).toEqual(false);

      // Pas de redistribution automatique de potentiel (car on a des règles de personnalisation) donc les points de cae_6.3.1.1 et cae_6.3.1.2 restent inchangés
      expect(scoresMap['cae_6.3.1.1'].point_potentiel).toEqual(
        scoresMap['cae_6.3.1.1'].point_referentiel
      );
      expect(scoresMap['cae_6.3.1.2'].point_potentiel).toEqual(
        scoresMap['cae_6.3.1.2'].point_referentiel
      );

      // Les points de  cae_6.3.1.3 et cae_6.3.1.5 ont été augmentés de 1 point chacun (facteur 1.625 dans les règles de personnalisation)
      expect(scoresMap['cae_6.3.1.3'].point_potentiel).toEqual(
        (scoresMap['cae_6.3.1.3'].point_referentiel || 0) + 1
      );
      expect(scoresMap['cae_6.3.1.3'].point_potentiel).toEqual(
        (scoresMap['cae_6.3.1.3'].point_referentiel || 0) * 1.625
      );
      expect(scoresMap['cae_6.3.1.5'].point_potentiel).toEqual(
        (scoresMap['cae_6.3.1.5'].point_referentiel || 0) + 1
      );
      expect(scoresMap['cae_6.3.1.5'].point_potentiel).toEqual(
        (scoresMap['cae_6.3.1.5'].point_referentiel || 0) * 1.625
      );

      // Les points de cae_6.3.1 restent inchangés
      expect(scoresMap['cae_6.3.1'].point_potentiel).toEqual(
        scoresMap['cae_6.3.1'].point_referentiel
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

      const reponses: GetPersonnalisationReponsesResponseType = {
        SAU: true,
      };
      const collectiviteInfo: IdentiteCollectivite = {
        type: CollectiviteTypeEnum.COMMUNE,
        soustype: null,
        population_tags: [],
        drom: true,
      };
      const personnalisationConsequences =
        await personnalisationService.getPersonnalisationConsequences(
          caePersonnalisationRegles,
          reponses,
          collectiviteInfo
        );

      const actionStatuts: GetActionStatutsResponseType = {};

      const scoresMap = referentielsScoringService.computeScoreMap(
        caeReferentiel,
        personnalisationConsequences,
        actionStatuts,
        3
      );

      expect(scoresMap['cae_6.4.1'].point_potentiel).toEqual(
        (scoresMap['cae_6.4.1'].point_referentiel || 0) * 0.5
      );
      expect(scoresMap['cae_6.4.1'].point_potentiel_perso).toEqual(
        (scoresMap['cae_6.4.1'].point_referentiel || 0) * 0.5
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
        expect(scoresMap[actionId].point_potentiel).toEqual(
          (scoresMap[actionId].point_referentiel || 0) * 0.5
        );
      });

      // 6.4.1.6 passe de 15% à 20%
      expect(scoresMap['cae_6.4.1.6'].point_potentiel).toEqual(
        ((scoresMap['cae_6.4.1'].point_potentiel || 0) * 20) / 100
      );
      expect(scoresMap['cae_6.4.1.6'].point_potentiel).toEqual(1.2);

      // 6.4.1.8 passe de 15% à 10%
      expect(scoresMap['cae_6.4.1.8'].point_potentiel).toEqual(
        ((scoresMap['cae_6.4.1'].point_potentiel || 0) * 10) / 100
      );
      expect(scoresMap['cae_6.4.1.8'].point_potentiel).toEqual(0.6);
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
        population_tags: [],
        drom: false,
      };
      const actionStatuts: GetActionStatutsResponseType = {};

      /**
     Cas 1 :  Si une commune est à 10 % de l'EPCI et qu'elle participe au conseil d'administration d'un bailleur social, elle est notée sur 3 points
     ------
     si identite(type, commune) et reponse(habitat_3, OUI) et reponse(habitat_2, 10%)
     - cae 6.2.1 est réduite à 2 points et on lui ajoute 1 point, donc a un potentiel de 3 points
     */

      const reponsesCas1: GetPersonnalisationReponsesResponseType = {
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

      expect(scoresMapCas1['cae_6.2.1'].point_potentiel).toEqual(3);

      /**
       Cas 2 :  Si une commune est à 50 % de l'EPCI et qu'elle participe au conseil d'administration d'un bailleur social, elle est notée sur 6 points
       -------
       si identite(type, commune) et reponse(habitat_3, OUI) et reponse(habitat_2, 50%)
       - cae 6.2.1 est réduite de 50% et on lui ajoute 1 point, donc a un potentiel de 6 points
       */

      const reponsesCas2: GetPersonnalisationReponsesResponseType = {
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

      expect(scoresMapCas2['cae_6.2.1'].point_potentiel).toEqual(6);

      /**
       Cas 3 :  Si une commune est à 10 % de l'EPCI et qu'elle ne participe pas au conseil d'administration d'un bailleur social, elle est notée sur 2 points
       ------
       si identite(type, commune) et reponse(habitat_3, NON) et reponse(habitat_2, 10%)
       - cae 6.2.1 est réduite à 2 points et on ne lui rajoute pas de points, donc a un potentiel de 2 points
       */

      const reponsesCas3: GetPersonnalisationReponsesResponseType = {
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

      expect(scoresMapCas3['cae_6.2.1'].point_potentiel).toEqual(2);
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
        population_tags: [],
        drom: false,
      };
      const epciInfo: IdentiteCollectivite = {
        type: CollectiviteTypeEnum.EPCI,
        soustype: null,
        population_tags: [],
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

      const actionStatutsCas1: GetActionStatutsResponseType = {
        'cae_1.2.3.3.1': {
          concerne: true,
          avancement: 'fait',
          avancement_detaille: [1, 0, 0],
        },
        'cae_1.2.3.3.2': {
          concerne: true,
          avancement: 'fait',
          avancement_detaille: [1, 0, 0],
        },
        'cae_1.2.3.3.3': {
          concerne: true,
          avancement: 'fait',
          avancement_detaille: [1, 0, 0],
        },
        'cae_1.2.3.3.4': {
          concerne: true,
          avancement: 'fait',
          avancement_detaille: [1, 0, 0],
        },
        'cae_1.2.3.3.5': {
          concerne: true,
          avancement: 'fait',
          avancement_detaille: [1, 0, 0],
        },
        'cae_3.3.5.3.1': {
          concerne: true,
          avancement: 'fait',
          avancement_detaille: [1, 0, 0],
        },
      };

      const reponsesCas1: GetPersonnalisationReponsesResponseType = {
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

      expect(scoresMapCas1['cae_1.2.3'].point_fait).toEqual(2.25);
      expect(scoresMapCas1['cae_3.3.5'].point_fait).toEqual(1.2);

      /**
       Cas 2 :  Si commune avec compétence déchets, il n'y a pas de réduction de potentiel mais le score de la 3.3.5 est majoré par celui de la 1.2.3
       La sous-action cae_3.3.5.3 vaut initialement 4.8 points
       Chaque tâche de cette sous-saction vaut 1.2 points, donc si une tâche est faite, score_realise(cae_3.3.5) = 1.2
       Aucune réponse pour cae_1.2.3 => score_realise(cae_1.2.3) = 0
       La majoration du score de la 3.3.5 par la 1.2.3 entraîne donc que la 3.3.5 vaut a un score réalisé de 0 point.
       */

      const actionStatutsCas2: GetActionStatutsResponseType = {
        'cae_3.3.5.3.1': {
          concerne: true,
          avancement: 'fait',
          avancement_detaille: [1, 0, 0],
        },
      };

      const reponsesCas2: GetPersonnalisationReponsesResponseType = {
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

      expect(scoresMapCas2['cae_1.2.3'].point_fait).toEqual(0);
      expect(scoresMapCas2['cae_3.3.5'].point_fait).toEqual(0); // Au lieu de 1.2 !

      /**
       Cas 3 :  Si EPCI sans compétence déchets et participation dans syndicat compétent de 10% et points_fait(cae_1.2.3, 2.25) alors potentiel(cae_3.3.5) = 2
       Quand reponse(dechets_2, NON), cae_1.2.3.3 est réduite de 75% et donc notée sur 2.25 points au lieu de 3 points
       Si toutes les tâches sont faites, alors le score réalisé de cae_1.2.3 est de 2.25
      */

      const actionStatutsCas3: GetActionStatutsResponseType = {
        'cae_1.2.3.3.1': {
          concerne: true,
          avancement: 'fait',
          avancement_detaille: [1, 0, 0],
        },
        'cae_1.2.3.3.2': {
          concerne: true,
          avancement: 'fait',
          avancement_detaille: [1, 0, 0],
        },
        'cae_1.2.3.3.3': {
          concerne: true,
          avancement: 'fait',
          avancement_detaille: [1, 0, 0],
        },
        'cae_1.2.3.3.4': {
          concerne: true,
          avancement: 'fait',
          avancement_detaille: [1, 0, 0],
        },
        'cae_1.2.3.3.5': {
          concerne: true,
          avancement: 'fait',
          avancement_detaille: [1, 0, 0],
        },
      };

      const reponsesCas3: GetPersonnalisationReponsesResponseType = {
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

      expect(scoresMapCas3['cae_1.2.3'].point_fait).toEqual(2.25);
      expect(scoresMapCas3['cae_3.3.5'].point_fait).toEqual(0);
      expect(scoresMapCas3['cae_3.3.5'].point_potentiel).toEqual(2.0);

      /**
       Cas 4 :  Si EPCI et non concernée à la 3.3.5, la règle n'a pas de conséquence
      */

      const actionStatutsCas4: GetActionStatutsResponseType = {};
      for (let i = 1; i < 7; i++) {
        actionStatutsCas4[`cae_3.3.5.1.${i}`] = {
          concerne: false,
          avancement: 'detaille',
          avancement_detaille: [0, 0, 0],
        };
      }
      for (let i = 1; i < 10; i++) {
        actionStatutsCas4[`cae_3.3.5.2.${i}`] = {
          concerne: false,
          avancement: 'detaille',
          avancement_detaille: [0, 0, 0],
        };
      }
      for (let i = 1; i < 5; i++) {
        actionStatutsCas4[`cae_3.3.5.3.${i}`] = {
          concerne: false,
          avancement: 'detaille',
          avancement_detaille: [0, 0, 0],
        };
      }

      const reponsesCas4: GetPersonnalisationReponsesResponseType = {
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
      expect(scoresMapCas4['cae_3.3.5'].point_potentiel).toEqual(0);
    });
  });

  describe('getScoreDiff', () => {
    it('python rounding issue', async () => {
      const scoreDiff = referentielsScoringService.getScoreDiff(
        {
          action_id: 'cae_6.5.1.2.8',
          point_referentiel: 0.338,
          point_potentiel: 0.338,
          point_potentiel_perso: null,
          point_fait: 0,
          point_pas_fait: 0,
          point_non_renseigne: 0.338,
          point_programme: 0,
          concerne: true,
          completed_taches_count: 0,
          total_taches_count: 1,
          fait_taches_avancement: 0,
          programme_taches_avancement: 0,
          pas_fait_taches_avancement: 0,
          pas_concerne_taches_avancement: 0,
          desactive: false,
          renseigne: false,
        },
        {
          concerne: true,
          action_id: 'cae_6.5.1.2.8',
          desactive: false,
          renseigne: false,
          point_fait: 0,
          point_pas_fait: 0,
          point_potentiel: 0.337,
          point_programme: 0,
          point_referentiel: 0.338,
          total_taches_count: 1,
          point_non_renseigne: 0.337,
          point_potentiel_perso: null,
          completed_taches_count: 0,
          fait_taches_avancement: 0,
          pas_fait_taches_avancement: 0,
          programme_taches_avancement: 0,
          pas_concerne_taches_avancement: 0,
        }
      );
      // Even if the difference is 0.001, it should not be considered as a difference because due to python issue
      expect(scoreDiff).toEqual(null);
    });
  });
});
