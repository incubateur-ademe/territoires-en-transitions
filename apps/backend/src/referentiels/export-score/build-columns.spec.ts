import { CollectiviteAvecType } from '@/backend/collectivites/identite-collectivite.dto';
import { StatutAvancementEnum } from '@/backend/referentiels/models/action-statut.table';
import { ActionTypeEnum } from '@/backend/referentiels/models/action-type.enum';
import { ComputeScoreMode } from '@/backend/referentiels/snapshots/compute-score-mode.enum';
import { SnapshotJalonEnum } from '@/backend/referentiels/snapshots/snapshot-jalon.enum';
import { Snapshot } from '@/backend/referentiels/snapshots/snapshot.table';
import { ScoresPayload } from '../snapshots/scores-payload.dto';
import { formatActionStatut } from './build-columns';
import {
  ExportMode,
  ScoreComparisonData,
  ScoreRow,
} from './load-score-comparison.service';

function createSnapshot(
  mode: ComputeScoreMode = ComputeScoreMode.RECALCUL
): Snapshot {
  return {
    collectiviteId: 1,
    referentielId: 'eci',
    ref: 'snapshot-test',
    nom: 'Test Snapshot',
    jalon: SnapshotJalonEnum.COURANT,
    date: '2024-01-01',
    pointFait: 0,
    pointProgramme: 0,
    pointPasFait: 0,
    pointPotentiel: 0,
    referentielVersion: null,
    auditId: null,
    createdAt: '2024-01-01',
    createdBy: null,
    modifiedAt: '2024-01-01',
    modifiedBy: null,
    scoresPayload: {
      collectiviteId: 1,
      referentielId: 'eci',
      referentielVersion: '1.0',
      collectiviteInfo: {
        nom: 'Test Collectivité',
      } as Partial<CollectiviteAvecType> as CollectiviteAvecType,
      date: '2024-01-01',
      scores: {
        actionId: 'eci',
        nom: 'ECI',
        identifiant: 'eci',
        categorie: null,
      } as ScoresPayload['scores'],
      jalon: SnapshotJalonEnum.COURANT,
      mode,
    },
    personnalisationReponses: {},
  };
}

function createScoreComparisonData(
  mode: ComputeScoreMode = ComputeScoreMode.RECALCUL,
  scoreRows: ScoreRow[] = []
): ScoreComparisonData {
  return {
    collectiviteName: 'Test Collectivité',
    referentielId: 'eci',
    exportMode: ExportMode.SINGLE_SNAPSHOT,
    exportTitle: 'Export état des lieux actuel',
    exportFileName: 'test.xlsx',
    snapshot1: createSnapshot(mode),
    snapshot2: null,
    snapshot1Label: 'Snapshot 1',
    snapshot2Label: '',
    scoreRows,
    auditeurs: null,
    descriptions: {},
    pilotes: {},
    services: {},
    fichesActionLiees: {},
    isScoreIndicatifEnabled: false,
  };
}

function createScoreRow(
  actionId: string,
  actionType: ActionTypeEnum,
  score: Partial<ScoresPayload['scores']['score']> & {
    actionsEnfant?: Array<{
      score: { actionId: string; concerne: boolean; avancement: string };
    }>;
    [key: string]: unknown;
  }
): ScoreRow {
  return {
    actionId,
    actionType,
    score1: {
      actionId,
      actionType,
      identifiant: actionId.split('_')[1] || actionId,
      nom: `Action ${actionId}`,
      categorie: null,
      score: {
        actionId,
        pointReferentiel: score.pointReferentiel || 0,
        pointPotentiel: score.pointPotentiel || 0,
        pointPotentielPerso: null,
        pointFait: score.pointFait ?? 0,
        pointPasFait: score.pointPasFait ?? 0,
        pointNonRenseigne: score.pointNonRenseigne ?? 0,
        pointProgramme: score.pointProgramme ?? 0,
        totalTachesCount: score.totalTachesCount ?? 1,
        completedTachesCount: score.completedTachesCount ?? 0,
        faitTachesAvancement: score.faitTachesAvancement ?? 0,
        programmeTachesAvancement: score.programmeTachesAvancement ?? 0,
        pasFaitTachesAvancement: score.pasFaitTachesAvancement ?? 0,
        pasConcerneTachesAvancement: score.pasConcerneTachesAvancement ?? 0,
        concerne: score.concerne ?? true,
        desactive: score.desactive ?? false,
        renseigne: score.renseigne ?? false,
        ...(score as Record<string, unknown>),
      },
      actionsEnfant: (score.actionsEnfant as never) || [],
      preuves: [],
      scoresTag: {},
    } as never,
    score2: null as never,
  } as ScoreRow;
}

describe('formatActionStatut', () => {
  describe('Mode DEPUIS_SAUVEGARDE', () => {
    it('retourne "Non disponible" quand le mode est DEPUIS_SAUVEGARDE', () => {
      const row = createScoreRow('eci_1.1', ActionTypeEnum.SOUS_ACTION, {
        avancement: StatutAvancementEnum.FAIT,
        pointReferentiel: 10,
        pointPotentiel: 10,
      });
      const data = createScoreComparisonData(
        ComputeScoreMode.DEPUIS_SAUVEGARDE,
        [row]
      );

      const result = formatActionStatut(row, data, 1);

      expect(result).toBe('Non disponible');
    });
  });

  describe('Données manquantes', () => {
    it('retourne une chaîne vide si actionScore est undefined', () => {
      const row = {
        actionId: 'eci_1.1',
        actionType: ActionTypeEnum.SOUS_ACTION,
        score1: undefined,
        score2: null,
      } as unknown as ScoreRow;
      const data = createScoreComparisonData();

      const result = formatActionStatut(row, data, 1);

      expect(result).toBe('');
    });
  });

  describe("Types d'action non concernés", () => {
    it('retourne une chaîne vide pour les axes', () => {
      const row = createScoreRow('eci_5', ActionTypeEnum.AXE, {});
      const data = createScoreComparisonData(undefined, [row]);

      expect(formatActionStatut(row, data, 1)).toBe('');
    });

    it('retourne une chaîne vide pour les sous-axes', () => {
      const row = createScoreRow('eci_5.1', ActionTypeEnum.SOUS_AXE, {});
      const data = createScoreComparisonData(undefined, [row]);

      expect(formatActionStatut(row, data, 1)).toBe('');
    });

    it('retourne une chaîne vide pour les actions', () => {
      const row = createScoreRow('eci_1', ActionTypeEnum.ACTION, {});
      const data = createScoreComparisonData(undefined, [row]);

      expect(formatActionStatut(row, data, 1)).toBe('');
    });
  });

  describe('Statut "Non concerné"', () => {
    it('retourne "Non concerné" quand concerne est false', () => {
      const row = createScoreRow('eci_1.1', ActionTypeEnum.SOUS_ACTION, {
        concerne: false,
      });
      const data = createScoreComparisonData(undefined, [row]);

      expect(formatActionStatut(row, data, 1)).toBe('Non concerné');
    });

    it('retourne "Non concerné" quand desactive est true', () => {
      const row = createScoreRow('eci_1.1', ActionTypeEnum.SOUS_ACTION, {
        desactive: true,
      });
      const data = createScoreComparisonData(undefined, [row]);

      expect(formatActionStatut(row, data, 1)).toBe('Non concerné');
    });
  });

  describe('Libellés des statuts', () => {
    it('retourne "Fait" pour le statut fait', () => {
      const row = createScoreRow('eci_1.1', ActionTypeEnum.SOUS_ACTION, {
        avancement: StatutAvancementEnum.FAIT,
      });
      const data = createScoreComparisonData(undefined, [row]);

      expect(formatActionStatut(row, data, 1)).toBe('Fait');
    });

    it('retourne "Pas fait" pour le statut pas_fait', () => {
      const row = createScoreRow('eci_1.1', ActionTypeEnum.SOUS_ACTION, {
        avancement: StatutAvancementEnum.PAS_FAIT,
      });
      const data = createScoreComparisonData(undefined, [row]);

      expect(formatActionStatut(row, data, 1)).toBe('Pas fait');
    });

    it('retourne "Programmé" pour le statut programme', () => {
      const row = createScoreRow('eci_1.1', ActionTypeEnum.SOUS_ACTION, {
        avancement: StatutAvancementEnum.PROGRAMME,
      });
      const data = createScoreComparisonData(undefined, [row]);

      expect(formatActionStatut(row, data, 1)).toBe('Programmé');
    });

    it('retourne "Non renseigné" pour le statut non_renseigne', () => {
      const row = createScoreRow('eci_1.1', ActionTypeEnum.SOUS_ACTION, {
        avancement: StatutAvancementEnum.NON_RENSEIGNE,
      });
      const data = createScoreComparisonData(undefined, [row]);

      expect(formatActionStatut(row, data, 1)).toBe('Non renseigné');
    });

    it('retourne "Détaillé" pour le statut detaille', () => {
      const row = createScoreRow('eci_1.1', ActionTypeEnum.SOUS_ACTION, {
        avancement: StatutAvancementEnum.DETAILLE,
      });
      const data = createScoreComparisonData(undefined, [row]);

      expect(formatActionStatut(row, data, 1)).toBe('Détaillé');
    });
  });

  describe('Statut non renseigné', () => {
    it('retourne "Non renseigné" quand avancement est undefined', () => {
      const row = createScoreRow('eci_1.1', ActionTypeEnum.SOUS_ACTION, {
        avancement: undefined,
      });
      const data = createScoreComparisonData(undefined, [row]);

      expect(formatActionStatut(row, data, 1)).toBe('Non renseigné');
    });
  });

  describe('Sous-actions avec avancement détaillé', () => {
    it('retourne "Détaillé" quand une sous-action sans statut a des enfants avec statut', () => {
      const row = createScoreRow('eci_1.1', ActionTypeEnum.SOUS_ACTION, {
        avancement: StatutAvancementEnum.NON_RENSEIGNE,
        actionsEnfant: [
          {
            score: {
              actionId: 'eci_1.1.1',
              concerne: true,
              avancement: StatutAvancementEnum.FAIT,
            },
          },
        ],
      });
      const data = createScoreComparisonData(undefined, [row]);

      expect(formatActionStatut(row, data, 1)).toBe('Détaillé');
    });

    it('retourne le statut normal si une sous-action a un statut valide', () => {
      const row = createScoreRow('eci_1.1', ActionTypeEnum.SOUS_ACTION, {
        avancement: StatutAvancementEnum.FAIT,
      });
      const data = createScoreComparisonData(undefined, [row]);

      expect(formatActionStatut(row, data, 1)).toBe('Fait');
    });
  });

  describe('Tâches', () => {
    it('retourne le statut de la tâche quand elle a un statut', () => {
      const row = createScoreRow('eci_1.1.1.1', ActionTypeEnum.TACHE, {
        avancement: StatutAvancementEnum.PROGRAMME,
      });
      const data = createScoreComparisonData(undefined, [row]);

      expect(formatActionStatut(row, data, 1)).toBe('Programmé');
    });

    it('retourne "Non renseigné" pour une tâche sans statut dont le parent est non renseigné', () => {
      const parent = createScoreRow('eci_1.1.1', ActionTypeEnum.SOUS_ACTION, {
        avancement: StatutAvancementEnum.NON_RENSEIGNE,
      });
      const row = createScoreRow('eci_1.1.1.1', ActionTypeEnum.TACHE, {
        avancement: undefined,
      });
      const data = createScoreComparisonData(undefined, [parent, row]);

      expect(formatActionStatut(row, data, 1)).toBe('Non renseigné');
    });

    it('retourne une chaîne vide pour une tâche sans statut dont le parent a un statut valide', () => {
      const parent = createScoreRow('eci_1.1.1', ActionTypeEnum.SOUS_ACTION, {
        avancement: StatutAvancementEnum.FAIT,
      });
      const row = createScoreRow('eci_1.1.1.1', ActionTypeEnum.TACHE, {
        avancement: undefined,
      });
      const data = createScoreComparisonData(undefined, [parent, row]);

      expect(formatActionStatut(row, data, 1)).toBe('');
    });

    it('retourne une chaîne vide pour une tâche sans statut dont le parent est non concerné', () => {
      const parent = createScoreRow('eci_1.1.1', ActionTypeEnum.SOUS_ACTION, {
        concerne: false,
      });
      const row = createScoreRow('eci_1.1.1.1', ActionTypeEnum.TACHE, {
        avancement: undefined,
      });
      const data = createScoreComparisonData(undefined, [parent, row]);

      expect(formatActionStatut(row, data, 1)).toBe('');
    });

    it('retourne une chaîne vide pour une tâche sans statut dont le parent est détaillé', () => {
      const parent = createScoreRow('eci_1.1.1', ActionTypeEnum.SOUS_ACTION, {
        avancement: StatutAvancementEnum.DETAILLE,
      });
      const row = createScoreRow('eci_1.1.1.1', ActionTypeEnum.TACHE, {
        avancement: undefined,
      });
      const data = createScoreComparisonData(undefined, [parent, row]);

      expect(formatActionStatut(row, data, 1)).toBe('');
    });

    it('retourne une chaîne vide pour une tâche avec un statut dont le parent est détaillé', () => {
      const parent = createScoreRow('eci_1.1.1', ActionTypeEnum.SOUS_ACTION, {
        avancement: StatutAvancementEnum.DETAILLE,
      });
      const row = createScoreRow('eci_1.1.1.1', ActionTypeEnum.TACHE, {
        avancement: StatutAvancementEnum.FAIT,
      });
      const data = createScoreComparisonData(undefined, [parent, row]);

      expect(formatActionStatut(row, data, 1)).toBe('');
    });
  });

  describe('Snapshot 2', () => {
    it('utilise score2 quand snapshotIndex est 2', () => {
      const row = createScoreRow('eci_1.1', ActionTypeEnum.SOUS_ACTION, {
        avancement: StatutAvancementEnum.PROGRAMME,
      });
      // Créer score2 avec avancement PROGRAMME
      row.score2 = {
        ...row.score1,
        score: {
          ...row.score1.score,
          avancement: StatutAvancementEnum.PROGRAMME,
        },
      };
      const data = createScoreComparisonData(undefined, [row]);

      const result = formatActionStatut(row, data, 2);

      expect(result).toBe('Programmé');
    });
  });
});
