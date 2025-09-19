import { PersonneTagOrUser } from '@/backend/collectivites/shared/models/personne-tag-or-user.dto';
import { TagWithCollectiviteId } from '@/backend/collectivites/tags/tag.table-base';
import ListFichesService from '@/backend/plans/fiches/list-fiches/list-fiches.service';
import { ExportScoreComparisonScoreIndicatifService } from '@/backend/referentiels/export-score/export-score-comparison-score-indicatif.service';
import { MesureId } from '@/backend/referentiels/models/action-definition.table';
import { DatabaseService } from '@/backend/utils';
import { Test } from '@nestjs/testing';
import { GetReferentielService } from '../get-referentiel/get-referentiel.service';
import { HandleMesurePilotesService } from '../handle-mesure-pilotes/handle-mesure-pilotes.service';
import { HandleMesureServicesService } from '../handle-mesure-services/handle-mesure-services.service';
import { deeperReferentielScoring } from '../models/samples/deeper-referentiel-scoring.sample';
import { simpleReferentielScoring } from '../models/samples/simple-referentiel-scoring.sample';
import { SnapshotsService } from '../snapshots/snapshots.service';

describe('ExportScoreComparisonService', () => {
  let exportService: ExportScoreComparisonScoreIndicatifService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ExportScoreComparisonScoreIndicatifService],
    })
      .useMocker((token) => {
        if (
          token === SnapshotsService ||
          token === DatabaseService ||
          token === HandleMesurePilotesService ||
          token === HandleMesureServicesService ||
          token === GetReferentielService ||
          token === ListFichesService
        ) {
          return {};
        }
      })
      .compile();

    exportService = moduleRef.get(ExportScoreComparisonScoreIndicatifService);
  });

  describe('getSnapshotComparisonRows', () => {
    it('should generate rows in single snapshot mode (simple referentiel)', () => {
      const descriptions: Record<MesureId, string> = {};
      const pilotes: Record<MesureId, PersonneTagOrUser[]> = {};
      const services: Record<MesureId, TagWithCollectiviteId[]> = {};
      const fichesActionLiees: Record<MesureId, string> = {};

      descriptions['eci_1.1'] =
        "Une stratégie territoriale de la politique Économie Circulaire et l'inscription dans le territoire nécessitent un portage politique et un pilotage technique dédiés, ainsi qu'un diagnostic et une stratégie d'économie circulaire avec des objectifs et des cibles clairement exprimés, cohérents avec les documents régionaux et nationaux.";

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

      fichesActionLiees['eci_1.1'] =
        'Ajouter caméra de surveillance au parking à vélo 2020-2024\n' +
        'Casques et gilets réfléchissants gratuits pour les mineurs 2020-2024\n' +
        'Course de vélo 2020-2024\n' +
        'Permis vélo CM2 école TET 2020-2024\n' +
        'Ramassage scolaire à vélo 2020-2024';

      const commonData = {
        descriptions,
        pilotes,
        services,
        fichesActionLiees,
      };

      const dataRows = exportService.buildAllRows(
        simpleReferentielScoring,
        null,
        true, // single snapshot mode
        commonData
      );

      expect(dataRows).toEqual([
        [
          'Total', // identifiant
          '', // nom
          '', // description
          '', // phase
          100, // pointsMaxReferentiel
          100, // pointsMaxPersonnalises
          10, // pointsRealises
          0.1, // scoreRealise
          null, // pointsProgrammes
          null, // scoreProgramme
          null, // pointsPasFait
          null, // scorePasFait
          '', // statut
          '', // commentaires
          '', // score indicatif
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '1',
          "Définition d'une stratégie globale de la politique économie circulaire et inscription dans le territoire",
          '', // description
          '', // phase
          30, // pointsMaxReferentiel
          30, // pointsMaxPersonnalises
          10, // pointsRealises
          0.333, // scoreRealise
          null, // pointsProgrammes
          null, // scoreProgramme
          null, // pointsPasFait
          null, // scorePasFait
          '', // statut
          '', // commentaires
          '', // score indicatif
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '1.1',
          'Définir une stratégie globale de la politique Economie Circulaire et assurer un portage politique fort',
          descriptions['eci_1.1'], // description
          '', // phase
          10, // pointsMaxReferentiel
          10, // pointsMaxPersonnalises
          10, // pointsRealises
          1, // scoreRealise
          null, // pointsProgrammes
          null, // scoreProgramme
          null, // pointsPasFait
          null, // scorePasFait
          'Fait', // statut
          '', // commentaires
          '', // score indicatif
          'Yolo Dodo, Lou Piote', // pilotes
          'Super Service, Ultra Service', // services
          '', // docs
          fichesActionLiees['eci_1.1'], // fiches actions liées
        ],
        [
          '1.2',
          "Développer une démarche transversale avec l'ensemble des politiques de la collectivité",
          '', // description
          '', // phase
          20, // pointsMaxReferentiel
          20, // pointsMaxPersonnalises
          null, // pointsRealises
          null, // scoreRealise
          null, // pointsProgrammes
          null, // scoreProgramme
          null, // pointsPasFait
          null, // scorePasFait
          'Non renseigné', // statut
          '', // commentaires
          '', // score indicatif
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '2',
          'Développement des services de réduction, collecte et valorisation des déchets',
          '', // description
          '', // phase
          70, // pointsMaxReferentiel
          70, // pointsMaxPersonnalises
          null, // pointsRealises
          null, // scoreRealise
          null, // pointsProgrammes
          null, // scoreProgramme
          null, // pointsPasFait
          null, // scorePasFait
          '', // statut
          '', // commentaires
          '', // score indicatif
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '2.0',
          'Respecter la réglementation en matière de prévention de déchets',
          '', // description
          '', // phase
          null, // pointsMaxReferentiel
          null, // pointsMaxPersonnalises
          null, // pointsRealises
          null, // scoreRealise
          null, // pointsProgrammes
          null, // scoreProgramme
          null, // pointsPasFait
          null, // scorePasFait
          'Non renseigné', // statut
          '', // commentaires
          // score indicatif
          'Pourcentage indicatif Fait de 20% calculé sur la base de : 123 kg/hab en 2025 (source : Données de la collectivité)',
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '2.1',
          'Mettre en œuvre les actions du PLPDMA',
          '', // description
          'Mise en œuvre', // phase
          65, // pointsMaxReferentiel
          65, // pointsMaxPersonnalises
          null, // pointsRealises
          null, // scoreRealise
          null, // pointsProgrammes
          null, // scoreProgramme
          null, // pointsPasFait
          null, // scorePasFait
          'Non renseigné', // statut
          'Explication de mise en œuvre', // commentaires
          '', // score indicatif
          '', // pilotes
          '', // services
          `preuve1.pdf
https://example.com/preuve2.pdf`, // docs
          '', // fiches actions liées
        ],
        [
          '2.2',
          "Disposer d'une commission consultative d'élaboration et de suivi (CCES) élargie",
          '', // description
          '', // phase
          5, // pointsMaxReferentiel
          5, // pointsMaxPersonnalises
          null, // pointsRealises
          null, // scoreRealise
          null, // pointsProgrammes
          null, // scoreProgramme
          null, // pointsPasFait
          null, // scorePasFait
          'Non renseigné', // statut
          '', // commentaires
          '', // score indicatif
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
      ]);
    });

    it('should generate comparison rows in comparison mode (simple referentiel)', () => {
      const descriptions: Record<MesureId, string> = {};
      const pilotes: Record<MesureId, PersonneTagOrUser[]> = {};
      const services: Record<MesureId, TagWithCollectiviteId[]> = {};
      const fichesActionLiees: Record<MesureId, string> = {};

      descriptions['eci_1.1'] =
        "Une stratégie territoriale de la politique Économie Circulaire et l'inscription dans le territoire nécessitent un portage politique et un pilotage technique dédiés, ainsi qu'un diagnostic et une stratégie d'économie circulaire avec des objectifs et des cibles clairement exprimés, cohérents avec les documents régionaux et nationaux.";

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

      fichesActionLiees['eci_1.1'] =
        'Ajouter caméra de surveillance au parking à vélo 2020-2024\n' +
        'Casques et gilets réfléchissants gratuits pour les mineurs 2020-2024\n' +
        'Course de vélo 2020-2024\n' +
        'Permis vélo CM2 école TET 2020-2024\n' +
        'Ramassage scolaire à vélo 2020-2024';

      const commonData = {
        descriptions,
        pilotes,
        services,
        fichesActionLiees,
      };

      const dataRows = exportService.buildAllRows(
        simpleReferentielScoring,
        simpleReferentielScoring, // Same data for both snapshots since we just want to test the comparison display, not the data differences
        false, // comparison mode
        commonData
      );

      expect(dataRows).toEqual([
        [
          'Total', // identifiant
          '', // nom
          '', // description
          '', // phase
          100, // pointsMaxReferentiel
          // Snapshot 1 data
          100, // snapshot1 pointsMaxPersonnalises
          10, // snapshot1 pointsRealises
          0.1, // snapshot1 scoreRealise
          null, // snapshot1 pointsProgrammes
          null, // snapshot1 scoreProgramme
          null, // snapshot1 pointsPasFait
          null, // snapshot1 scorePasFait
          '', // snapshot1 statut
          '', // commentaires
          '', // score indicatif
          // Snapshot 2 data (same as snapshot 1)
          100, // snapshot2 pointsMaxPersonnalises
          10, // snapshot2 pointsRealises
          0.1, // snapshot2 scoreRealise
          null, // snapshot2 pointsProgrammes
          null, // snapshot2 scoreProgramme
          null, // snapshot2 pointsPasFait
          null, // snapshot2 scorePasFait
          '', // snapshot2 statut
          '', // commentaires
          '', // score indicatif
          // Common data
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '1',
          "Définition d'une stratégie globale de la politique économie circulaire et inscription dans le territoire",
          '', // description
          '', // phase
          30, // pointsMaxReferentiel
          // Snapshot 1 data
          30, // snapshot1 pointsMaxPersonnalises
          10, // snapshot1 pointsRealises
          0.333, // snapshot1 scoreRealise
          null, // snapshot1 pointsProgrammes
          null, // snapshot1 scoreProgramme
          null, // snapshot1 pointsPasFait
          null, // snapshot1 scorePasFait
          '', // snapshot1 statut
          '', // commentaires
          '', // score indicatif
          // Snapshot 2 data (same as snapshot 1)
          30, // snapshot2 pointsMaxPersonnalises
          10, // snapshot2 pointsRealises
          0.333, // snapshot2 scoreRealise
          null, // snapshot2 pointsProgrammes
          null, // snapshot2 scoreProgramme
          null, // snapshot2 pointsPasFait
          null, // snapshot2 scorePasFait
          '', // commentaires
          '', // score indicatif
          '', // snapshot2 statut
          // Common data
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '1.1',
          'Définir une stratégie globale de la politique Economie Circulaire et assurer un portage politique fort',
          descriptions['eci_1.1'], // description
          '', // phase
          10, // pointsMaxReferentiel
          // Snapshot 1 data
          10, // snapshot1 pointsMaxPersonnalises
          10, // snapshot1 pointsRealises
          1, // snapshot1 scoreRealise
          null, // snapshot1 pointsProgrammes
          null, // snapshot1 scoreProgramme
          null, // snapshot1 pointsPasFait
          null, // snapshot1 scorePasFait
          'Fait', // snapshot1 statut
          '', // commentaires
          '', // score indicatif
          // Snapshot 2 data (same as snapshot 1)
          10, // snapshot2 pointsMaxPersonnalises
          10, // snapshot2 pointsRealises
          1, // snapshot2 scoreRealise
          null, // snapshot2 pointsProgrammes
          null, // snapshot2 scoreProgramme
          null, // snapshot2 pointsPasFait
          null, // snapshot2 scorePasFait
          'Fait', // snapshot2 statut
          '', // commentaires
          '', // score indicatif
          // Common data
          'Yolo Dodo, Lou Piote', // pilotes
          'Super Service, Ultra Service', // services
          '', // docs
          fichesActionLiees['eci_1.1'], // fiches actions liées
        ],
        [
          '1.2',
          "Développer une démarche transversale avec l'ensemble des politiques de la collectivité",
          '', // description
          '', // phase
          20, // pointsMaxReferentiel
          // Snapshot 1 data
          20, // snapshot1 pointsMaxPersonnalises
          null, // snapshot1 pointsRealises
          null, // snapshot1 scoreRealise
          null, // snapshot1 pointsProgrammes
          null, // snapshot1 scoreProgramme
          null, // snapshot1 pointsPasFait
          null, // snapshot1 scorePasFait
          'Non renseigné', // snapshot1 statut
          '', // commentaires
          '', // score indicatif
          // Snapshot 2 data (same as snapshot 1)
          20, // snapshot2 pointsMaxPersonnalises
          null, // snapshot2 pointsRealises
          null, // snapshot2 scoreRealise
          null, // snapshot2 pointsProgrammes
          null, // snapshot2 scoreProgramme
          null, // snapshot2 pointsPasFait
          null, // snapshot2 scorePasFait
          'Non renseigné', // snapshot2 statut
          '', // commentaires
          '', // score indicatif
          // Common data
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '2',
          'Développement des services de réduction, collecte et valorisation des déchets',
          '', // description
          '', // phase
          70, // pointsMaxReferentiel
          // Snapshot 1 data
          70, // snapshot1 pointsMaxPersonnalises
          null, // snapshot1 pointsRealises
          null, // snapshot1 scoreRealise
          null, // snapshot1 pointsProgrammes
          null, // snapshot1 scoreProgramme
          null, // snapshot1 pointsPasFait
          null, // snapshot1 scorePasFait
          '', // snapshot1 statut
          '', // commentaires
          '', // score indicatif
          // Snapshot 2 data (same as snapshot 1)
          70, // snapshot2 pointsMaxPersonnalises
          null, // snapshot2 pointsRealises
          null, // snapshot2 scoreRealise
          null, // snapshot2 pointsProgrammes
          null, // snapshot2 scoreProgramme
          null, // snapshot2 pointsPasFait
          null, // snapshot2 scorePasFait
          '', // snapshot2 statut
          '', // commentaires
          '', // score indicatif
          // Common data
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '2.0',
          'Respecter la réglementation en matière de prévention de déchets',
          '', // description
          '', // phase
          null, // pointsMaxReferentiel
          // Snapshot 1 data
          null, // snapshot1 pointsMaxPersonnalises
          null, // snapshot1 pointsRealises
          null, // snapshot1 scoreRealise
          null, // snapshot1 pointsProgrammes
          null, // snapshot1 scoreProgramme
          null, // snapshot1 pointsPasFait
          null, // snapshot1 scorePasFait
          'Non renseigné', // snapshot1 statut
          '', // commentaires
          // score indicatif
          'Pourcentage indicatif Fait de 20% calculé sur la base de : 123 kg/hab en 2025 (source : Données de la collectivité)',
          // Snapshot 2 data (same as snapshot 1)
          null, // snapshot2 pointsMaxPersonnalises
          null, // snapshot2 pointsRealises
          null, // snapshot2 scoreRealise
          null, // snapshot2 pointsProgrammes
          null, // snapshot2 scoreProgramme
          null, // snapshot2 pointsPasFait
          null, // snapshot2 scorePasFait
          'Non renseigné', // snapshot2 statut
          '', // commentaires
          // score indicatif
          'Pourcentage indicatif Fait de 20% calculé sur la base de : 123 kg/hab en 2025 (source : Données de la collectivité)',
          // Common data
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '2.1',
          'Mettre en œuvre les actions du PLPDMA',
          '', // description
          'Mise en œuvre', // phase
          65, // pointsMaxReferentiel
          // Snapshot 1 data
          65, // snapshot1 pointsMaxPersonnalises
          null, // snapshot1 pointsRealises
          null, // snapshot1 scoreRealise
          null, // snapshot1 pointsProgrammes
          null, // snapshot1 scoreProgramme
          null, // snapshot1 pointsPasFait
          null, // snapshot1 scorePasFait
          'Non renseigné', // snapshot1 statut
          'Explication de mise en œuvre', // commentaires
          '', // score indicatif
          // Snapshot 2 data (same as snapshot 1)
          65, // snapshot2 pointsMaxPersonnalises
          null, // snapshot2 pointsRealises
          null, // snapshot2 scoreRealise
          null, // snapshot2 pointsProgrammes
          null, // snapshot2 scoreProgramme
          null, // snapshot2 pointsPasFait
          null, // snapshot2 scorePasFait
          'Non renseigné', // snapshot2 statut
          'Explication de mise en œuvre', // commentaires
          '', // score indicatif
          // Common data
          '', // pilotes
          '', // services
          `preuve1.pdf
https://example.com/preuve2.pdf`, // docs
          '', // fiches actions liées
        ],
        [
          '2.2',
          "Disposer d'une commission consultative d'élaboration et de suivi (CCES) élargie",
          '', // description
          '', // phase
          5, // pointsMaxReferentiel
          // Snapshot 1 data
          5, // snapshot1 pointsMaxPersonnalises
          null, // snapshot1 pointsRealises
          null, // snapshot1 scoreRealise
          null, // snapshot1 pointsProgrammes
          null, // snapshot1 scoreProgramme
          null, // snapshot1 pointsPasFait
          null, // snapshot1 scorePasFait
          'Non renseigné', // snapshot1 statut
          '', // commentaires
          '', // score indicatif
          // Snapshot 2 data (same as snapshot 1)
          5, // snapshot2 pointsMaxPersonnalises
          null, // snapshot2 pointsRealises
          null, // snapshot2 scoreRealise
          null, // snapshot2 pointsProgrammes
          null, // snapshot2 scoreProgramme
          null, // snapshot2 pointsPasFait
          null, // snapshot2 scorePasFait
          'Non renseigné', // snapshot2 statut
          '', // commentaires
          '', // score indicatif
          // Common data
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
      ]);
    });

    it('should generate rows in single snapshot mode (deeper referentiel)', () => {
      const descriptions: Record<MesureId, string> = {};
      const pilotes: Record<MesureId, PersonneTagOrUser[]> = {};
      const services: Record<MesureId, TagWithCollectiviteId[]> = {};
      const fichesActionLiees: Record<MesureId, string> = {};

      descriptions['eci_1.1'] =
        'Une stratégie territoriale de la politique Économie Circulaire...';

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

      fichesActionLiees['eci_1.1'] =
        'Ajouter caméra de surveillance au parking à vélo 2020-2024\n' +
        'Casques et gilets réfléchissants gratuits pour les mineurs 2020-2024\n' +
        'Course de vélo 2020-2024\n' +
        'Permis vélo CM2 école TET 2020-2024\n' +
        'Ramassage scolaire à vélo 2020-2024';

      const commonData = {
        descriptions,
        pilotes,
        services,
        fichesActionLiees,
      };

      const dataRows = exportService.buildAllRows(
        deeperReferentielScoring,
        null,
        true, // single snapshot mode
        commonData
      );

      expect(dataRows).toEqual([
        [
          'Total', // identifiant
          '', // nom
          '', // description
          '', // phase
          100, // pointsMaxReferentiel
          100, // pointsMaxPersonnalises
          65, // pointsRealises
          0.65, // scoreRealise
          null, // pointsProgrammes
          null, // scoreProgramme
          null, // pointsPasFait
          null, // scorePasFait
          '', // statut
          '', // commentaires
          '', // score indicatif
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '1',
          'Action 1',
          '', // description
          '', // phase
          30, // pointsMaxReferentiel
          30, // pointsMaxPersonnalises
          null, // pointsRealises
          null, // scoreRealise
          null, // pointsProgrammes
          null, // scoreProgramme
          null, // pointsPasFait
          null, // scorePasFait
          '', // statut
          '', // commentaires
          '', // score indicatif
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '1.1',
          'Sous-action 1.1',
          descriptions['eci_1.1'], // description
          '', // phase
          10, // pointsMaxReferentiel
          10, // pointsMaxPersonnalises
          null, // pointsRealises
          null, // scoreRealise
          null, // pointsProgrammes
          null, // scoreProgramme
          null, // pointsPasFait
          null, // scorePasFait
          'Non concerné', // statut (concerne: false)
          '', // commentaires
          '', // score indicatif
          'Yolo Dodo, Lou Piote', // pilotes
          'Super Service, Ultra Service', // services
          '', // docs
          fichesActionLiees['eci_1.1'], // fiches actions liées
        ],
        [
          '1.2',
          'Sous-action 1.2',
          '', // description
          '', // phase
          20, // pointsMaxReferentiel
          20, // pointsMaxPersonnalises
          null, // pointsRealises
          null, // scoreRealise
          null, // pointsProgrammes
          null, // scoreProgramme
          null, // pointsPasFait
          null, // scorePasFait
          'Non concerné',
          '', // commentaires
          '', // score indicatif
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '2',
          'Action 2',
          '', // description
          '', // phase
          70, // pointsMaxReferentiel
          70, // pointsMaxPersonnalises
          65, // pointsRealises
          0.929, // scoreRealise
          null, // pointsProgrammes
          null, // scoreProgramme
          null, // pointsPasFait
          null, // scorePasFait
          '', // statut
          '', // commentaires
          '', // score indicatif
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '2.0',
          'Sous-action 2.0',
          '', // description
          '', // phase
          null, // pointsMaxReferentiel
          null, // pointsMaxPersonnalises
          null, // pointsRealises
          null, // scoreRealise
          null, // pointsProgrammes
          null, // scoreProgramme
          null, // pointsPasFait
          null, // scorePasFait
          'Non renseigné', // statut
          '', // commentaires
          '', // score indicatif
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '2.1',
          'Mettre en œuvre les actions du PLPDMA',
          '', // description
          'Mise en œuvre', // phase
          65, // pointsMaxReferentiel
          65, // pointsMaxPersonnalises
          65, // pointsRealises
          1, // scoreRealise
          null, // pointsProgrammes
          null, // scoreProgramme
          null, // pointsPasFait
          null, // scorePasFait
          'Fait', // statut
          '', // commentaires
          '', // score indicatif
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '2.1.0',
          'Tache 2.1.0',
          '', // description
          '', // phase
          null, // pointsMaxReferentiel
          null, // pointsMaxPersonnalises
          null, // pointsRealises
          null, // scoreRealise
          null, // pointsProgrammes
          null, // scoreProgramme
          null, // pointsPasFait
          null, // scorePasFait
          '', // statut (tâche sans status, parent non détaillé)
          '', // commentaires
          '', // score indicatif
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '2.1.0.1',
          'Doter la politique climat-air-énergie de moyens humains',
          '', // description
          'Bases', // phase
          1.2, // pointsMaxReferentiel
          1.2, // pointsMaxPersonnalises
          null, // pointsRealises
          null, // scoreRealise
          null, // pointsProgrammes
          null, // scoreProgramme
          null, // pointsPasFait
          null, // scorePasFait
          'Non renseigné', // statut
          '', // commentaires
          '', // score indicatif
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '2.1.1',
          'Tache 2.1.1',
          '', // description
          '', // phase
          40, // pointsMaxReferentiel
          40, // pointsMaxPersonnalises
          32, // pointsRealises
          0.8, // scoreRealise
          8, // pointsProgrammes
          0.2, // scoreProgramme
          null, // pointsPasFait
          null, // scorePasFait
          'Détaillé', // statut
          '', // commentaires
          '', // score indicatif
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '2.1.2',
          'Tache 2.1.2',
          '', // description
          '', // phase
          25, // pointsMaxReferentiel
          25, // pointsMaxPersonnalises
          null, // pointsRealises
          null, // scoreRealise
          null, // pointsProgrammes
          null, // scoreProgramme
          null, // pointsPasFait
          null, // scorePasFait
          '', // statut (tâche sans status, parent non détaillé)
          '', // commentaires
          '', // score indicatif
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '2.2',
          'Sous-action 2.2',
          '', // description
          'Bases', // phase
          5, // pointsMaxReferentiel
          5, // pointsMaxPersonnalises
          null, // pointsRealises
          null, // scoreRealise
          null, // pointsProgrammes
          null, // scoreProgramme
          1.5, // pointsPasFait
          0.3, // scorePasFait
          'Détaillé', // statut (a des enfants avec avancement)
          '', // commentaires
          '', // score indicatif
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '2.2.1',
          'Tache 2.2.1',
          '', // description
          '', // phase
          2, // pointsMaxReferentiel
          2, // pointsMaxPersonnalises
          null, // pointsRealises
          null, // scoreRealise
          null, // pointsProgrammes
          null, // scoreProgramme
          null, // pointsPasFait
          null, // scorePasFait
          '', // statut
          '', // commentaires
          '', // score indicatif
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '2.2.2',
          'Tache 2.2.2',
          '', // description
          '', // phase
          1.5, // pointsMaxReferentiel
          1.5, // pointsMaxPersonnalises
          null, // pointsRealises
          null, // scoreRealise
          null, // pointsProgrammes
          null, // scoreProgramme
          1.5, // pointsPasFait
          1, // scorePasFait
          'Pas fait', // statut
          '', // commentaires
          '', // score indicatif
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '2.2.3',
          'Tache 2.2.3',
          '', // description
          '', // phase
          1.5, // pointsMaxReferentiel
          1.5, // pointsMaxPersonnalises
          null, // pointsRealises
          null, // scoreRealise
          null, // pointsProgrammes
          null, // scoreProgramme
          null, // pointsPasFait
          null, // scorePasFait
          '', // statut
          '', // commentaires
          '', // score indicatif
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
      ]);
    });

    it('should generate comparison rows for two snapshots (deeper referentiel)', () => {
      const descriptions: Record<MesureId, string> = {};
      const pilotes: Record<MesureId, PersonneTagOrUser[]> = {};
      const services: Record<MesureId, TagWithCollectiviteId[]> = {};
      const fichesActionLiees: Record<MesureId, string> = {};

      descriptions['eci_1.1'] =
        "Une stratégie territoriale de la politique Économie Circulaire et l'inscription dans le territoire nécessitent un portage politique et un pilotage technique dédiés, ainsi qu'un diagnostic et une stratégie d'économie circulaire avec des objectifs et des cibles clairement exprimés, cohérents avec les documents régionaux et nationaux.";

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

      fichesActionLiees['eci_1.1'] =
        'Ajouter caméra de surveillance au parking à vélo 2020-2024\n' +
        'Casques et gilets réfléchissants gratuits pour les mineurs 2020-2024\n' +
        'Course de vélo 2020-2024\n' +
        'Permis vélo CM2 école TET 2020-2024\n' +
        'Ramassage scolaire à vélo 2020-2024';

      const commonData = {
        descriptions,
        pilotes,
        services,
        fichesActionLiees,
      };

      const dataRows = exportService.buildAllRows(
        deeperReferentielScoring,
        deeperReferentielScoring, // Same data for both snapshots since we just want to test the comparison display, not the data differences
        false, // comparison mode
        commonData
      );

      expect(dataRows).toEqual([
        [
          'Total', // identifiant
          '', // nom
          '', // description
          '', // phase
          100, // pointsMaxReferentiel
          // Snapshot 1 data
          100, // snapshot1 pointsMaxPersonnalises
          65, // snapshot1 pointsRealises
          0.65, // snapshot1 scoreRealise
          null, // snapshot1 pointsProgrammes
          null, // snapshot1 scoreProgramme
          null, // snapshot1 pointsPasFait
          null, // snapshot1 scorePasFait
          '', // snapshot1 statut
          '', // commentaires
          '', // score indicatif
          // Snapshot 2 data (same as snapshot 1)
          100, // snapshot2 pointsMaxPersonnalises
          65, // snapshot2 pointsRealises
          0.65, // snapshot2 scoreRealise
          null, // snapshot2 pointsProgrammes
          null, // snapshot2 scoreProgramme
          null, // snapshot2 pointsPasFait
          null, // snapshot2 scorePasFait
          '', // snapshot2 statut
          '', // commentaires
          '', // score indicatif
          // Common data
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '1',
          'Action 1',
          '', // description
          '', // phase
          30, // pointsMaxReferentiel
          // Snapshot 1 data
          30, // snapshot1 pointsMaxPersonnalises
          null, // snapshot1 pointsRealises
          null, // snapshot1 scoreRealise
          null, // snapshot1 pointsProgrammes
          null, // snapshot1 scoreProgramme
          null, // snapshot1 pointsPasFait
          null, // snapshot1 scorePasFait
          '', // snapshot1 statut
          '', // commentaires
          '', // score indicatif
          // Snapshot 2 data (same as snapshot 1)
          30, // snapshot2 pointsMaxPersonnalises
          null, // snapshot2 pointsRealises
          null, // snapshot2 scoreRealise
          null, // snapshot2 pointsProgrammes
          null, // snapshot2 scoreProgramme
          null, // snapshot2 pointsPasFait
          null, // snapshot2 scorePasFait
          '', // snapshot2 statut
          '', // commentaires
          '', // score indicatif
          // Common data
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '1.1',
          'Sous-action 1.1',
          descriptions['eci_1.1'], // description
          '', // phase
          10, // pointsMaxReferentiel
          // Snapshot 1 data
          10, // snapshot1 pointsMaxPersonnalises
          null, // snapshot1 pointsRealises
          null, // snapshot1 scoreRealise
          null, // snapshot1 pointsProgrammes
          null, // snapshot1 scoreProgramme
          null, // snapshot1 pointsPasFait
          null, // snapshot1 scorePasFait
          'Non concerné', // snapshot1 statut
          '', // commentaires
          '', // score indicatif
          // Snapshot 2 data (same as snapshot 1)
          10, // snapshot2 pointsMaxPersonnalises
          null, // snapshot2 pointsRealises
          null, // snapshot2 scoreRealise
          null, // snapshot2 pointsProgrammes
          null, // snapshot2 scoreProgramme
          null, // snapshot2 pointsPasFait
          null, // snapshot2 scorePasFait
          'Non concerné', // snapshot2 statut
          '', // commentaires
          '', // score indicatif
          // Common data
          'Yolo Dodo, Lou Piote', // pilotes
          'Super Service, Ultra Service', // services
          '', // docs
          fichesActionLiees['eci_1.1'], // fiches actions liées
        ],
        [
          '1.2',
          'Sous-action 1.2',
          '', // description
          '', // phase
          20, // pointsMaxReferentiel
          // Snapshot 1 data
          20, // snapshot1 pointsMaxPersonnalises
          null, // snapshot1 pointsRealises
          null, // snapshot1 scoreRealise
          null, // snapshot1 pointsProgrammes
          null, // snapshot1 scoreProgramme
          null, // snapshot1 pointsPasFait
          null, // snapshot1 scorePasFait
          'Non concerné', // snapshot1 statut
          '', // commentaires
          '', // score indicatif
          // Snapshot 2 data (same as snapshot 1)
          20, // snapshot2 pointsMaxPersonnalises
          null, // snapshot2 pointsRealises
          null, // snapshot2 scoreRealise
          null, // snapshot2 pointsProgrammes
          null, // snapshot2 scoreProgramme
          null, // snapshot2 pointsPasFait
          null, // snapshot2 scorePasFait
          'Non concerné', // snapshot2 statut
          '', // commentaires
          '', // score indicatif
          // Common data
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '2',
          'Action 2',
          '', // description
          '', // phase
          70, // pointsMaxReferentiel
          // Snapshot 1 data
          70, // snapshot1 pointsMaxPersonnalises
          65, // snapshot1 pointsRealises
          0.929, // snapshot1 scoreRealise
          null, // snapshot1 pointsProgrammes
          null, // snapshot1 scoreProgramme
          null, // snapshot1 pointsPasFait
          null, // snapshot1 scorePasFait
          '', // snapshot1 statut
          '', // commentaires
          '', // score indicatif
          // Snapshot 2 data (same as snapshot 1)
          70, // snapshot2 pointsMaxPersonnalises
          65, // snapshot2 pointsRealises
          0.929, // snapshot2 scoreRealise
          null, // snapshot2 pointsProgrammes
          null, // snapshot2 scoreProgramme
          null, // snapshot2 pointsPasFait
          null, // snapshot2 scorePasFait
          '', // snapshot2 statut
          '', // commentaires
          '', // score indicatif
          // Common data
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '2.0',
          'Sous-action 2.0',
          '', // description
          '', // phase
          null, // pointsMaxReferentiel
          // Snapshot 1 data
          null, // snapshot1 pointsMaxPersonnalises
          null, // snapshot1 pointsRealises
          null, // snapshot1 scoreRealise
          null, // snapshot1 pointsProgrammes
          null, // snapshot1 scoreProgramme
          null, // snapshot1 pointsPasFait
          null, // snapshot1 scorePasFait
          'Non renseigné', // snapshot1 statut
          '', // commentaires
          '', // score indicatif
          // Snapshot 2 data (same as snapshot 1)
          null, // snapshot2 pointsMaxPersonnalises
          null, // snapshot2 pointsRealises
          null, // snapshot2 scoreRealise
          null, // snapshot2 pointsProgrammes
          null, // snapshot2 scoreProgramme
          null, // snapshot2 pointsPasFait
          null, // snapshot2 scorePasFait
          'Non renseigné', // snapshot2 statut
          '', // commentaires
          '', // score indicatif
          // Common data
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '2.1',
          'Mettre en œuvre les actions du PLPDMA',
          '', // description
          'Mise en œuvre', // phase
          65, // pointsMaxReferentiel
          // Snapshot 1 data
          65, // snapshot1 pointsMaxPersonnalises
          65, // snapshot1 pointsRealises
          1, // snapshot1 scoreRealise
          null, // snapshot1 pointsProgrammes
          null, // snapshot1 scoreProgramme
          null, // snapshot1 pointsPasFait
          null, // snapshot1 scorePasFait
          'Fait', // snapshot1 statut
          '', // commentaires
          '', // score indicatif
          // Snapshot 2 data (same as snapshot 1)
          65, // snapshot2 pointsMaxPersonnalises
          65, // snapshot2 pointsRealises
          1, // snapshot2 scoreRealise
          null, // snapshot2 pointsProgrammes
          null, // snapshot2 scoreProgramme
          null, // snapshot2 pointsPasFait
          null, // snapshot2 scorePasFait
          'Fait', // snapshot2 statut
          '', // commentaires
          '', // score indicatif
          // Common data
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '2.1.0',
          'Tache 2.1.0',
          '', // description
          '', // phase
          null, // pointsMaxReferentiel
          // Snapshot 1 data
          null, // snapshot1 pointsMaxPersonnalises
          null, // snapshot1 pointsRealises
          null, // snapshot1 scoreRealise
          null, // snapshot1 pointsProgrammes
          null, // snapshot1 scoreProgramme
          null, // snapshot1 pointsPasFait
          null, // snapshot1 scorePasFait
          '', // snapshot1 statut
          '', // commentaires
          '', // score indicatif
          // Snapshot 2 data (same as snapshot 1)
          null, // snapshot2 pointsMaxPersonnalises
          null, // snapshot2 pointsRealises
          null, // snapshot2 scoreRealise
          null, // snapshot2 pointsProgrammes
          null, // snapshot2 scoreProgramme
          null, // snapshot2 pointsPasFait
          null, // snapshot2 scorePasFait
          '', // snapshot2 statut
          '', // commentaires
          '', // score indicatif
          // Common data
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '2.1.0.1',
          'Doter la politique climat-air-énergie de moyens humains',
          '', // description
          'Bases', // phase
          1.2, // pointsMaxReferentiel
          // Snapshot 1 data
          1.2, // snapshot1 pointsMaxPersonnalises
          null, // snapshot1 pointsRealises
          null, // snapshot1 scoreRealise
          null, // snapshot1 pointsProgrammes
          null, // snapshot1 scoreProgramme
          null, // snapshot1 pointsPasFait
          null, // snapshot1 scorePasFait
          'Non renseigné', // snapshot1 statut
          '', // commentaires
          '', // score indicatif
          // Snapshot 2 data (same as snapshot 1)
          1.2, // snapshot2 pointsMaxPersonnalises
          null, // snapshot2 pointsRealises
          null, // snapshot2 scoreRealise
          null, // snapshot2 pointsProgrammes
          null, // snapshot2 scoreProgramme
          null, // snapshot2 pointsPasFait
          null, // snapshot2 scorePasFait
          'Non renseigné', // snapshot2 statut
          '', // commentaires
          '', // score indicatif
          // Common data
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '2.1.1',
          'Tache 2.1.1',
          '', // description
          '', // phase
          40, // pointsMaxReferentiel
          // Snapshot 1 data
          40, // snapshot1 pointsMaxPersonnalises
          32, // snapshot1 pointsRealises
          0.8, // snapshot1 scoreRealise
          8, // snapshot1 pointsProgrammes
          0.2, // snapshot1 scoreProgramme
          null, // snapshot1 pointsPasFait
          null, // snapshot1 scorePasFait
          'Détaillé', // snapshot1 statut
          '', // commentaires
          '', // score indicatif
          // Snapshot 2 data (same as snapshot 1)
          40, // snapshot2 pointsMaxPersonnalises
          32, // snapshot2 pointsRealises
          0.8, // snapshot2 scoreRealise
          8, // snapshot2 pointsProgrammes
          0.2, // snapshot2 scoreProgramme
          null, // snapshot2 pointsPasFait
          null, // snapshot2 scorePasFait
          'Détaillé', // snapshot2 statut
          '', // commentaires
          '', // score indicatif
          // Common data
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '2.1.2',
          'Tache 2.1.2',
          '', // description
          '', // phase
          25, // pointsMaxReferentiel
          // Snapshot 1 data
          25, // snapshot1 pointsMaxPersonnalises
          null, // snapshot1 pointsRealises
          null, // snapshot1 scoreRealise
          null, // snapshot1 pointsProgrammes
          null, // snapshot1 scoreProgramme
          null, // snapshot1 pointsPasFait
          null, // snapshot1 scorePasFait
          '', // snapshot1 statut
          '', // commentaires
          '', // score indicatif
          // Snapshot 2 data (same as snapshot 1)
          25, // snapshot2 pointsMaxPersonnalises
          null, // snapshot2 pointsRealises
          null, // snapshot2 scoreRealise
          null, // snapshot2 pointsProgrammes
          null, // snapshot2 scoreProgramme
          null, // snapshot2 pointsPasFait
          null, // snapshot2 scorePasFait
          '', // snapshot2 statut
          '', // commentaires
          '', // score indicatif
          // Common data
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '2.2',
          'Sous-action 2.2',
          '', // description
          'Bases', // phase
          5, // pointsMaxReferentiel
          // Snapshot 1 data
          5, // snapshot1 pointsMaxPersonnalises
          null, // snapshot1 pointsRealises
          null, // snapshot1 scoreRealise
          null, // snapshot1 pointsProgrammes
          null, // snapshot1 scoreProgramme
          1.5, // snapshot1 pointsPasFait
          0.3, // snapshot1 scorePasFait
          'Détaillé', // snapshot1 statut
          '', // commentaires
          '', // score indicatif
          // Snapshot 2 data (same as snapshot 1)
          5, // snapshot2 pointsMaxPersonnalises
          null, // snapshot2 pointsRealises
          null, // snapshot2 scoreRealise
          null, // snapshot2 pointsProgrammes
          null, // snapshot2 scoreProgramme
          1.5, // snapshot2 pointsPasFait
          0.3, // snapshot2 scorePasFait
          'Détaillé', // snapshot2 statut
          '', // commentaires
          '', // score indicatif
          // Common data
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '2.2.1',
          'Tache 2.2.1',
          '', // description
          '', // phase
          2, // pointsMaxReferentiel
          // Snapshot 1 data
          2, // snapshot1 pointsMaxPersonnalises
          null, // snapshot1 pointsRealises
          null, // snapshot1 scoreRealise
          null, // snapshot1 pointsProgrammes
          null, // snapshot1 scoreProgramme
          null, // snapshot1 pointsPasFait
          null, // snapshot1 scorePasFait
          '', // snapshot1 statut
          '', // commentaires
          '', // score indicatif
          // Snapshot 2 data (same as snapshot 1)
          2, // snapshot2 pointsMaxPersonnalises
          null, // snapshot2 pointsRealises
          null, // snapshot2 scoreRealise
          null, // snapshot2 pointsProgrammes
          null, // snapshot2 scoreProgramme
          null, // snapshot2 pointsPasFait
          null, // snapshot2 scorePasFait
          '', // snapshot2 statut
          '', // commentaires
          '', // score indicatif
          // Common data
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '2.2.2',
          'Tache 2.2.2',
          '', // description
          '', // phase
          1.5, // pointsMaxReferentiel
          // Snapshot 1 data
          1.5, // snapshot1 pointsMaxPersonnalises
          null, // snapshot1 pointsRealises
          null, // snapshot1 scoreRealise
          null, // snapshot1 pointsProgrammes
          null, // snapshot1 scoreProgramme
          1.5, // snapshot1 pointsPasFait
          1, // snapshot1 scorePasFait
          'Pas fait', // snapshot1 statut
          '', // commentaires
          '', // score indicatif
          // Snapshot 2 data (same as snapshot 1)
          1.5, // snapshot2 pointsMaxPersonnalises
          null, // snapshot2 pointsRealises
          null, // snapshot2 scoreRealise
          null, // snapshot2 pointsProgrammes
          null, // snapshot2 scoreProgramme
          1.5, // snapshot2 pointsPasFait
          1, // snapshot2 scorePasFait
          'Pas fait', // snapshot2 statut
          '', // commentaires
          '', // score indicatif
          // Common data
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
        [
          '2.2.3',
          'Tache 2.2.3',
          '', // description
          '', // phase
          1.5, // pointsMaxReferentiel
          // Snapshot 1 data
          1.5, // snapshot1 pointsMaxPersonnalises
          null, // snapshot1 pointsRealises
          null, // snapshot1 scoreRealise
          null, // snapshot1 pointsProgrammes
          null, // snapshot1 scoreProgramme
          null, // snapshot1 pointsPasFait
          null, // snapshot1 scorePasFait
          '', // snapshot1 statut
          '', // commentaires
          '', // score indicatif
          // Snapshot 2 data (same as snapshot 1)
          1.5, // snapshot2 pointsMaxPersonnalises
          null, // snapshot2 pointsRealises
          null, // snapshot2 scoreRealise
          null, // snapshot2 pointsProgrammes
          null, // snapshot2 scoreProgramme
          null, // snapshot2 pointsPasFait
          null, // snapshot2 scorePasFait
          '', // snapshot2 statut
          '', // commentaires
          '', // score indicatif
          // Common data
          '', // pilotes
          '', // services
          '', // docs
          '', // fiches actions liées
        ],
      ]);
    });
  });
});
