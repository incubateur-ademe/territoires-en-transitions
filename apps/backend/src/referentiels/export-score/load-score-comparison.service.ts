import ListFichesService from '@/backend/plans/fiches/list-fiches/list-fiches.service';
import { ExportScoreComparisonRequestQuery } from '@/backend/referentiels/export-score/export-score-comparison.request';
import { HandleMesureServicesService } from '@/backend/referentiels/handle-mesure-services/handle-mesure-services.service';
import { auditeurTable } from '@/backend/referentiels/labellisations/auditeur.table';
import { dcpTable } from '@/backend/users/models/dcp.table';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { unaccent } from '@/backend/utils/unaccent.utils';
import {
  PersonneTagOrUser,
  TagWithCollectiviteId,
} from '@/domain/collectivites';
import {
  ActionId,
  ActionTypeEnum,
  flatMapActionsEnfants,
  ReferentielId,
  ScoreSnapshot,
  SnapshotJalonEnum,
  TreeOfActionsIncludingScore,
} from '@/domain/referentiels';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { format } from 'date-fns';
import { and, desc, eq } from 'drizzle-orm';
import * as Utils from '../../utils/excel/export-excel.utils';
import { GetReferentielService } from '../get-referentiel/get-referentiel.service';
import { HandleMesurePilotesService } from '../handle-mesure-pilotes/handle-mesure-pilotes.service';
import { auditTable } from '../labellisations/audit.table';
import { snapshotTable } from '../snapshots/snapshot.table';
import { SnapshotsService } from '../snapshots/snapshots.service';

export type Auditeur = {
  prenom: string | null;
  nom: string | null;
};

export type ScoreRow = {
  actionId: ActionId;
  actionType: ActionTypeEnum;
  score1: TreeOfActionsIncludingScore;
  score2: TreeOfActionsIncludingScore | null;
};

export type ScoreComparisonData = {
  collectiviteName: string;
  referentielId: ReferentielId;
  exportMode: ExportMode;
  exportTitle: string;
  exportFileName: string;
  snapshot1: ScoreSnapshot;
  snapshot2: ScoreSnapshot | null;
  scoreRows: ScoreRow[];
  snapshot1Label: string;
  snapshot2Label: string;
  auditeurs: Auditeur[] | null;
  descriptions: Record<ActionId, string>;
  pilotes: Record<ActionId, PersonneTagOrUser[]>;
  services: Record<ActionId, TagWithCollectiviteId[]>;
  fichesActionLiees: Record<ActionId, string>;
  isScoreIndicatifEnabled: boolean | undefined;
};

export enum ExportMode {
  AUDIT = 'audit',
  SINGLE_SNAPSHOT = 'single_snapshot',
  COMPARISON = 'comparison',
}

const EXPORT_TITLES: Record<ExportMode, string> = {
  [ExportMode.AUDIT]: 'Export audit',
  [ExportMode.SINGLE_SNAPSHOT]: 'Export état des lieux actuel',
  [ExportMode.COMPARISON]: 'Export comparaison des sauvegardes',
};

@Injectable()
/**
 * Charge et prépare toutes les données nécessaires à l'export
 */
export class LoadScoreComparisonService {
  private readonly logger = new Logger(LoadScoreComparisonService.name);

  constructor(
    private readonly snapshotsService: SnapshotsService,
    private readonly databaseService: DatabaseService,
    private readonly handlePilotesService: HandleMesurePilotesService,
    private readonly handleServicesService: HandleMesureServicesService,
    private readonly getReferentielService: GetReferentielService,
    private readonly listFichesService: ListFichesService
  ) {}

  async loadScoreComparison(
    collectiviteId: number,
    referentielId: ReferentielId,
    query: ExportScoreComparisonRequestQuery
  ): Promise<ScoreComparisonData> {
    const {
      exportFormat,
      isAudit,
      isScoreIndicatifEnabled,
      snapshotReferences,
    } = query;

    const exportMode = this.getExportMode(isAudit, snapshotReferences);

    if (exportMode === ExportMode.SINGLE_SNAPSHOT) {
      this.logger.log(
        `Export de l'état des lieux actuel pour la collectivité ${collectiviteId}, referentiel ${referentielId}`
      );
    } else if (exportMode === ExportMode.AUDIT) {
      this.logger.log(
        `Export du score d'audit pour la collectivité ${collectiviteId}, referentiel ${referentielId}`
      );
    } else if (exportMode === ExportMode.COMPARISON) {
      this.logger.log(
        `Export de la comparaison des scores pour la collectivité ${collectiviteId}, referentiel ${referentielId}`
      );
    }

    if (
      exportMode !== ExportMode.AUDIT &&
      (!snapshotReferences || !snapshotReferences.length)
    ) {
      throw new NotFoundException(
        `Pas de référence de snapshot fournie pour la collectivité ${collectiviteId}, referentiel ${referentielId}`
      );
    }

    // charge les snapshots et agrège les scores
    const { snapshot1, snapshot2 } = await this.getSnapshots(
      exportMode,
      collectiviteId,
      referentielId,
      snapshotReferences
    );
    const scoreRows = this.transformSnapshotsIntoRows(snapshot1, snapshot2);

    // charge les données ne faisant pas partie des snapshots (auditeurs, etc.)
    const auditeurs = isAudit
      ? await this.getAuditeurs(
          snapshot1.auditId,
          collectiviteId,
          referentielId
        )
      : null;
    const descriptions = await this.getActionDescriptions(referentielId);
    const mesureIds = scoreRows.map((r) => r.actionId);
    const pilotes = await this.handlePilotesService.listPilotes(
      collectiviteId,
      mesureIds
    );
    const services = await this.handleServicesService.listServices(
      collectiviteId,
      mesureIds
    );
    const fichesActionLiees = await this.getFichesActionLiees(
      collectiviteId,
      mesureIds
    );

    const { snapshot1Label, snapshot2Label } = this.getScoreHeaderLabels(
      exportMode,
      snapshot1,
      snapshot2
    );
    const collectiviteName = snapshot1.scoresPayload.collectiviteInfo.nom;
    const exportFileName = this.getExportFileName(
      exportMode,
      snapshot1,
      collectiviteName,
      referentielId,
      exportFormat
    );

    return {
      collectiviteName,
      referentielId,
      exportMode,
      exportTitle: EXPORT_TITLES[exportMode],
      exportFileName,
      snapshot1,
      snapshot2,
      snapshot1Label,
      snapshot2Label,
      scoreRows,
      auditeurs,
      descriptions,
      pilotes,
      services,
      fichesActionLiees,
      isScoreIndicatifEnabled,
    };
  }

  private getExportMode(
    isAuditExport?: boolean,
    snapshotReferences?: string[]
  ): ExportMode {
    const nbRefs = snapshotReferences?.length ?? 0;
    if (nbRefs === 1) {
      return ExportMode.SINGLE_SNAPSHOT;
    }

    const isComparison = !isAuditExport && nbRefs > 1;
    if (isAuditExport) {
      return ExportMode.AUDIT;
    }
    if (isComparison) {
      return ExportMode.COMPARISON;
    }

    throw new Error(`Mode d'export invalide`);
  }

  private async getSnapshots(
    mode: ExportMode,
    collectiviteId: number,
    referentielId: ReferentielId,
    snapshotReferences?: string[]
  ): Promise<{ snapshot1: ScoreSnapshot; snapshot2: ScoreSnapshot | null }> {
    const { snapshot1Ref, snapshot2Ref } = await this.getSnapshotReferences(
      mode,
      collectiviteId,
      referentielId,
      snapshotReferences
    );

    let snapshot1: ScoreSnapshot | null = null;
    let snapshot2: ScoreSnapshot | null = null;

    if (mode === ExportMode.SINGLE_SNAPSHOT) {
      snapshot1 =
        snapshot1Ref === SnapshotsService.SCORE_COURANT_SNAPSHOT_REF
          ? await this.snapshotsService.computeAndUpsert({
              collectiviteId,
              referentielId,
              jalon: SnapshotJalonEnum.COURANT,
            })
          : await this.snapshotsService.get(
              collectiviteId,
              referentielId,
              snapshot1Ref
            );
      // In single snapshot mode, there is no snapshot2
      snapshot2 = null;
    }

    if (mode === ExportMode.COMPARISON || mode === ExportMode.AUDIT) {
      if (!snapshot2Ref) {
        throw new Error(
          `La référence snapshot2Ref est requise pour l'export de comparaison de deux sauvegardes (collectivité ${collectiviteId}, referentiel ${referentielId})`
        );
      }

      [snapshot1, snapshot2] = await Promise.all([
        snapshot1Ref === SnapshotsService.SCORE_COURANT_SNAPSHOT_REF
          ? // Force recompute of the current snapshot to be sure to have the latest version,
            // especially because we need mesures explications and preuves to be present in the current snapshot,
            // but when the user edit them, it doesn't currently trigger a snapshot update
            this.snapshotsService.computeAndUpsert({
              collectiviteId,
              referentielId,
              jalon: SnapshotJalonEnum.COURANT,
            })
          : this.snapshotsService.get(
              collectiviteId,
              referentielId,
              snapshot1Ref
            ),
        snapshot2Ref === SnapshotsService.SCORE_COURANT_SNAPSHOT_REF
          ? // Force recompute of the current snapshot to be sure to have the latest version,
            // especially because we need mesures explications and preuves to be present in the current snapshot,
            // but when the user edit them, it doesn't currently trigger a snapshot update
            this.snapshotsService.computeAndUpsert({
              collectiviteId,
              referentielId,
              jalon: SnapshotJalonEnum.COURANT,
            })
          : this.snapshotsService.get(
              collectiviteId,
              referentielId,
              snapshot2Ref
            ),
      ]);
    }

    if (!snapshot1) {
      throw new Error(
        `Snapshot1 est null pour la collectivité ${collectiviteId}, referentiel ${referentielId}`
      );
    }

    if (mode === ExportMode.COMPARISON && !snapshot2) {
      throw new Error(
        `Snapshot2 est null pour la collectivité ${collectiviteId}, referentiel ${referentielId}`
      );
    }

    return { snapshot1, snapshot2 };
  }

  private async getSnapshotReferences(
    mode: ExportMode,
    collectiviteId: number,
    referentielId: ReferentielId,
    snapshotReferences?: string[]
  ): Promise<{ snapshot1Ref: string; snapshot2Ref: string | null }> {
    let snapshot1Ref: string | null = null;
    let snapshot2Ref: string | null = null;

    if (
      mode !== ExportMode.AUDIT &&
      mode !== ExportMode.SINGLE_SNAPSHOT &&
      mode !== ExportMode.COMPARISON
    ) {
      throw new Error(`Mode d'export invalide: ${mode}`);
    }

    if (mode === ExportMode.AUDIT) {
      snapshot1Ref = await this.getOpenedPreAuditSnapshotRef(
        collectiviteId,
        referentielId
      );
      snapshot2Ref = SnapshotsService.SCORE_COURANT_SNAPSHOT_REF;
    } else {
      snapshot1Ref = snapshotReferences?.[0] || null;
      snapshot2Ref = snapshotReferences?.[1] || null;
    }

    if (!snapshot1Ref) {
      throw new NotFoundException(
        `La référence snapshot1Ref est requise pour l'export (collectivité ${collectiviteId}, referentiel ${referentielId})`
      );
    }

    return { snapshot1Ref, snapshot2Ref };
  }

  /**
   * Agrège les scores en une liste d'actions triées par identifiant
   */
  private transformSnapshotsIntoRows(
    snapshot1: ScoreSnapshot,
    snapshot2: ScoreSnapshot | null
  ): ScoreRow[] {
    const snapshot1Scores = snapshot1.scoresPayload.scores;
    const snapshot2Scores = snapshot2?.scoresPayload.scores;
    const s1Rows = flatMapActionsEnfants(snapshot1Scores);
    const s2Rows = snapshot2Scores
      ? flatMapActionsEnfants(snapshot2Scores)
      : null;
    return (
      s1Rows
        .map((score1) => {
          const { actionId, actionType } = score1;
          const score2 =
            s2Rows?.find((score2) => {
              return score2.actionId === actionId;
            }) || null;
          return {
            actionId,
            actionType,
            score1,
            score2,
          };
        })
        // tri les lignes par actionId (pour éviter d'avoir 1, 10, 2)
        .toSorted((a, b) => {
          return a.actionId.localeCompare(b.actionId, undefined, {
            numeric: true,
            sensitivity: 'base',
          });
        })
    );
  }

  private async getActionDescriptions(
    referentielId: ReferentielId
  ): Promise<Record<ActionId, string>> {
    const referentiel = await this.getReferentielService.getReferentielTree(
      referentielId,
      false
    );

    const descriptions: Record<string, string> = {};

    type ActionWithAllFields = typeof referentiel.itemsTree & {
      description?: string;
      nom?: string;
      identifiant?: string;
      actionsEnfant?: ActionWithAllFields[];
    };

    const extractDescriptions = (action: ActionWithAllFields) => {
      if (action.actionId && action.description) {
        descriptions[action.actionId] = Utils.cleanHtmlDescription(
          action.description
        );
      }
      if (action.actionsEnfant) {
        action.actionsEnfant.forEach(extractDescriptions);
      }
    };

    extractDescriptions(referentiel.itemsTree as ActionWithAllFields);
    return descriptions;
  }

  private async getFichesActionLiees(
    collectiviteId: number,
    mesureIds: ActionId[]
  ): Promise<Record<ActionId, string>> {
    const fichesActionLiees: Record<string, string[]> = {};

    try {
      const { data: fiches } =
        await this.listFichesService.getFichesActionResumes({
          collectiviteId,
          filters: {
            mesureIds,
          },
        });

      if (fiches && fiches.length > 0) {
        for (const fiche of fiches) {
          if (!fiche.mesures || !fiche.titre) continue;

          for (const mesure of fiche.mesures) {
            if (!mesureIds.includes(mesure.id)) continue;

            if (!fichesActionLiees[mesure.id]) {
              fichesActionLiees[mesure.id] = [fiche.titre];
            } else {
              fichesActionLiees[mesure.id].push(fiche.titre);
            }
          }
        }
      }
    } catch (error) {
      this.logger.warn(
        `Erreur lors de la récupération des fiches d'action liées:`,
        error
      );
    }

    // Tri les titres de fiche par ordre alphabétique
    const sortedFiches: Record<string, string> = {};
    for (const [actionId, titres] of Object.entries(fichesActionLiees)) {
      sortedFiches[actionId] = titres
        .map((titre) => titre.trim())
        .filter((titre) => titre.length > 0)
        .sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }))
        .join('\n');
    }

    return sortedFiches;
  }

  /**
   * Find the snapshot-ref associated to the current opened audit
   */
  private async getOpenedPreAuditSnapshotRef(
    collectiviteId: number,
    referentielId: ReferentielId
  ): Promise<string> {
    const [openedPreAuditSnapshot] = await this.databaseService.db
      .select({
        snapshotRef: snapshotTable.ref,
      })
      .from(snapshotTable)
      .leftJoin(auditTable, eq(snapshotTable.auditId, auditTable.id))
      .where(
        and(
          eq(auditTable.collectiviteId, collectiviteId),
          eq(snapshotTable.jalon, SnapshotJalonEnum.PRE_AUDIT),
          eq(snapshotTable.referentielId, referentielId)
        )
      )
      .orderBy(desc(snapshotTable.date))
      .limit(1);

    if (!openedPreAuditSnapshot) {
      throw new NotFoundException(
        `No opened pre-audit snapshot found for collectivite ${collectiviteId}, referentiel ${referentielId}`
      );
    }

    return openedPreAuditSnapshot.snapshotRef;
  }

  /**
   * Charge la liste des auditeurs rattachés à un snapshot
   */
  private async getAuditeurs(
    auditId: number | null,
    collectiviteId: number,
    referentielId: ReferentielId
  ) {
    let auditeurs: Auditeur[] = [];

    if (auditId) {
      auditeurs = await this.databaseService.db
        .select({
          prenom: dcpTable.prenom,
          nom: dcpTable.nom,
        })
        .from(auditeurTable)
        .leftJoin(dcpTable, eq(dcpTable.userId, auditeurTable.auditeur))
        .where(eq(auditeurTable.auditId, auditId));

      if (!auditeurs.length) {
        this.logger.warn(
          `No auditeurs found for collectivite ${collectiviteId}, referentiel ${referentielId}, audit ${auditId}`
        );
      }
    } else {
      this.logger.warn(
        `No auditId found in snapshot for collectivite ${collectiviteId}, referentiel ${referentielId}`
      );
    }

    return auditeurs;
  }

  private getScoreHeaderLabels(
    mode: ExportMode,
    snapshot1: ScoreSnapshot,
    snapshot2: ScoreSnapshot | null
  ): { snapshot1Label: string; snapshot2Label: string } {
    let snapshot1Label: string = snapshot1.nom;

    if (mode === ExportMode.AUDIT) {
      snapshot1Label = 'Proposé avant audit dans la plateforme';
    }

    if (
      mode === ExportMode.SINGLE_SNAPSHOT &&
      snapshot1.ref === SnapshotsService.SCORE_COURANT_SNAPSHOT_REF
    ) {
      snapshot1Label = 'Évaluation dans la plateforme';
    }

    if (
      mode === ExportMode.COMPARISON &&
      snapshot1.ref === SnapshotsService.SCORE_COURANT_SNAPSHOT_REF
    ) {
      snapshot1Label = 'État des lieux actuel';
    }

    let snapshot2Label: string = snapshot2?.nom || ''; // default value

    if (mode === ExportMode.AUDIT) {
      snapshot2Label = 'Audité dans la plateforme';
    }

    if (mode === ExportMode.SINGLE_SNAPSHOT) {
      snapshot2Label = ''; // Single snapshot case - won't be displayed
    }

    if (
      mode === ExportMode.COMPARISON &&
      snapshot2?.ref === SnapshotsService.SCORE_COURANT_SNAPSHOT_REF
    ) {
      snapshot2Label = 'État des lieux actuel';
    }

    return { snapshot1Label, snapshot2Label };
  }

  // Génère le nom du fichier exporté
  private getExportFileName(
    mode: ExportMode,
    snapshot1: ScoreSnapshot,
    collectiviteName: string | null,
    referentielId: ReferentielId,
    exportFormat: 'excel' | 'csv'
  ): string {
    const extension = exportFormat === 'excel' ? '.xlsx' : '.csv';
    const exportedAt = format(new Date(), 'yyyy-MM-dd');

    if (mode === ExportMode.AUDIT) {
      return unaccent(
        `Export_audit_${collectiviteName}_${exportedAt}${extension}`
      );
    }
    if (mode === ExportMode.SINGLE_SNAPSHOT) {
      if (snapshot1.ref === SnapshotsService.SCORE_COURANT_SNAPSHOT_REF) {
        return unaccent(
          `Export_${referentielId?.toUpperCase()}_${collectiviteName}_${exportedAt}${extension}`
        );
      }
      return unaccent(`Export_${snapshot1.nom}_${exportedAt}${extension}`);
    }
    return unaccent(
      `Export_comparaison_${referentielId?.toUpperCase()}_${collectiviteName}_${exportedAt}${extension}`
    );
  }
}
