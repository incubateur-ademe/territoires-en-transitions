import { Injectable, Logger } from '@nestjs/common';
import ListPersonnalisationQuestionsService from '@tet/backend/collectivites/personnalisations/list-personnalisation-questions/list-personnalisation-questions.service';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import { HandleMesureServicesService } from '@tet/backend/referentiels/handle-mesure-services/handle-mesure-services.service';
import { auditeurTable } from '@tet/backend/referentiels/labellisations/auditeur.table';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { unaccent } from '@tet/backend/utils/unaccent.utils';
import {
  PersonneTagOrUser,
  QuestionType,
  TagWithCollectiviteId,
} from '@tet/domain/collectivites';
import {
  ActionId,
  flatMapActionsEnfants,
  ReferentielId,
  rollUpActionIdToActionLevel,
  ScoreSnapshot,
  SnapshotJalonEnum,
  TreeOfActionsIncludingScore,
  type ActionType,
  type ExportScoreComparisonRequestQuery,
} from '@tet/domain/referentiels';
import { htmlToText } from '@tet/domain/utils';
import { format } from 'date-fns';
import { and, desc, eq } from 'drizzle-orm';
import * as Utils from '../../utils/excel/export-excel.utils';
import { GetReferentielService } from '../get-referentiel/get-referentiel.service';
import { HandleMesurePilotesService } from '../handle-mesure-pilotes/handle-mesure-pilotes.service';
import { auditTable } from '../labellisations/audit.table';
import { snapshotTable } from '../snapshots/snapshot.table';
import { SNAPSHOTS } from '../snapshots/snapshots.constants';
import {
  SnapshotsErrorEnum,
  type SnapshotsError,
} from '../snapshots/snapshots.errors';
import { SnapshotsService } from '../snapshots/snapshots.service';
import {
  ExportScoreComparisonErrorEnum,
  type ExportScoreComparisonError,
} from './export-score-comparison.errors';

export type Auditeur = {
  prenom: string | null;
  nom: string | null;
};

export type ScoreRow = {
  actionId: ActionId;
  actionType: ActionType;
  score1: TreeOfActionsIncludingScore;
  score2: TreeOfActionsIncludingScore | null;
};

/** Mesure du référentiel exporté affectée par une question de personnalisation */
export type MesureAffectee = {
  actionId: ActionId;
  /** numérotation de la mesure (ex. « 1.2.3 »), vide pour le référentiel CR */
  identifiant: string;
  /** libellé de la mesure */
  nom: string;
};

export type PersonnalisationExportQuestion = {
  questionId: string;
  thematiqueNom: string | null;
  /** libellé de la question en texte brut */
  formulation: string;
  /** ordre d'affichage de la question au sein de sa thématique */
  ordonnancement: number | null;
  type: QuestionType;
  choix: { id: string; formulation: string }[];
  /**
   * Mesures du référentiel exporté affectées par la question : chaque lien
   * question→action est remonté au niveau « mesure » puis dédoublonné, comme
   * dans la section « Afficher les mesures affectées et règles associées » de la
   * page Personnalisation. Le résultat est restreint aux mesures du référentiel
   * exporté (un lien pointant vers un autre référentiel est ignoré).
   */
  mesuresAffectees: MesureAffectee[];
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
  personnalisationQuestions: PersonnalisationExportQuestion[];
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
    private readonly listFichesService: ListFichesService,
    private readonly listPersonnalisationQuestionsService: ListPersonnalisationQuestionsService
  ) {}

  async loadScoreComparison(
    collectiviteId: number,
    referentielId: ReferentielId,
    query: ExportScoreComparisonRequestQuery,
    { user }: { user: AuthUser }
  ): Promise<Result<ScoreComparisonData, ExportScoreComparisonError>> {
    const { exportFormat, isAudit, snapshotReferences } = query;
    const excludeDesactive = query.excludeDesactive === true;

    const exportModeResult = this.getExportMode(isAudit, snapshotReferences);
    if (!exportModeResult.success) {
      return exportModeResult;
    }
    const exportMode = exportModeResult.data;

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
      return failure(
        ExportScoreComparisonErrorEnum.EXPORT_SNAPSHOT_REFERENCE_REQUIRED,
        new Error(
          `Pas de référence de snapshot fournie pour la collectivité ${collectiviteId}, referentiel ${referentielId}`
        )
      );
    }

    // charge les snapshots et agrège les scores
    const snapshotsResult = await this.getSnapshots(
      exportMode,
      collectiviteId,
      referentielId,
      snapshotReferences
    );
    if (!snapshotsResult.success) {
      return snapshotsResult;
    }
    const { snapshot1, snapshot2 } = snapshotsResult.data;
    const scoreRows = this.transformSnapshotsIntoRows(
      snapshot1,
      snapshot2,
      excludeDesactive
    );

    // charge les données ne faisant pas partie des snapshots (auditeurs, etc.)
    const auditeurs = isAudit
      ? await this.getAuditeurs(
          snapshot1.auditId,
          collectiviteId,
          referentielId
        )
      : null;
    // un seul chargement de l'arbre du référentiel exporté, consommé à la fois
    // pour les descriptions d'action et pour les mesures affectées des questions
    // de personnalisation
    const { hierarchie, actionsById, descriptions } =
      await this.getReferentielActionsIndex(referentielId);
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
      mesureIds,
      { user }
    );
    const personnalisationQuestions = await this.getPersonnalisationQuestions(
      referentielId,
      { hierarchie, actionsById }
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

    return success({
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
      personnalisationQuestions,
    });
  }

  /**
   * Charge toutes les questions de personnalisation rattachées au référentiel
   * exporté (indépendamment de leur activation pour la collectivité) et les
   * prépare pour la feuille "Personnalisation".
   */
  private async getPersonnalisationQuestions(
    referentielId: ReferentielId,
    actionsIndex: {
      hierarchie: ActionType[];
      actionsById: Map<ActionId, { identifiant: string; nom: string }>;
    }
  ): Promise<PersonnalisationExportQuestion[]> {
    try {
      const questions =
        await this.listPersonnalisationQuestionsService.listQuestionsWithChoices(
          [referentielId]
        );
      return questions.map((question) => ({
        questionId: question.id,
        thematiqueNom: question.thematiqueNom ?? null,
        formulation: htmlToText(question.formulation || '').trim(),
        ordonnancement: question.ordonnancement ?? null,
        type: question.type,
        choix: (question.choix ?? []).map((choix) => ({
          id: choix.id,
          formulation: choix.formulation,
        })),
        mesuresAffectees: this.resolveMesuresAffectees(
          question.actionIds,
          actionsIndex
        ),
      }));
    } catch (error) {
      this.logger.warn(
        `Erreur lors de la récupération des questions de personnalisation pour le référentiel ${referentielId}:`,
        error
      );
      return [];
    }
  }

  /**
   * Charge l'arbre du référentiel exporté une seule fois et en dérive :
   * - `hierarchie` : les niveaux ordonnés du référentiel (axe, sous-axe,
   *   mesure…), nécessaires pour remonter un lien question→action au niveau
   *   « mesure » ;
   * - `actionsById` : index par `actionId` (numérotation + libellé), pour
   *   résoudre les mesures affectées par les questions de personnalisation ;
   * - `descriptions` : description HTML nettoyée, par `actionId`.
   */
  private async getReferentielActionsIndex(
    referentielId: ReferentielId
  ): Promise<{
    hierarchie: ActionType[];
    actionsById: Map<ActionId, { identifiant: string; nom: string }>;
    descriptions: Record<ActionId, string>;
  }> {
    const referentiel = await this.getReferentielService.getReferentielTree(
      referentielId
    );

    type ActionNode = {
      actionId?: ActionId;
      identifiant?: string | null;
      nom?: string | null;
      description?: string | null;
      actionsEnfant?: ActionNode[];
    };

    const actionsById = new Map<
      ActionId,
      { identifiant: string; nom: string }
    >();
    const descriptions: Record<ActionId, string> = {};
    const walk = (node: ActionNode) => {
      if (node.actionId) {
        actionsById.set(node.actionId, {
          identifiant: node.identifiant ?? '',
          nom: (node.nom ?? '').trim(),
        });
        if (node.description) {
          descriptions[node.actionId] = Utils.cleanHtmlDescription(
            node.description
          );
        }
      }
      node.actionsEnfant?.forEach(walk);
    };
    walk(referentiel.itemsTree as ActionNode);

    return {
      hierarchie: referentiel.orderedItemTypes,
      actionsById,
      descriptions,
    };
  }

  /**
   * Reproduit la logique de la section « Afficher les mesures affectées et
   * règles associées » de la page personnalisation : remonte chaque lien
   * question→action au niveau « mesure » (via `rollUpActionIdToActionLevel`),
   * dédoublonne, puis résout numérotation et libellé depuis l'index du
   * référentiel exporté.
   *
   * - le tri est fait ici (et non en SQL) car `array_agg` trie de façon
   *   lexicographique et placerait « 4.10 » avant « 4.2 » ;
   * - le `flatMap` ne conserve que les mesures présentes dans l'index : c'est ce
   *   qui restreint le résultat au seul référentiel exporté (un lien vers une
   *   autre version / un autre référentiel est ignoré).
   */
  private resolveMesuresAffectees(
    actionIds: string[] | null | undefined,
    {
      hierarchie,
      actionsById,
    }: {
      hierarchie: ActionType[];
      actionsById: Map<ActionId, { identifiant: string; nom: string }>;
    }
  ): MesureAffectee[] {
    if (!actionIds?.length) {
      return [];
    }

    const mesureIds = [
      ...new Set(
        actionIds.map((actionId) => {
          try {
            return rollUpActionIdToActionLevel(actionId, hierarchie);
          } catch {
            return actionId;
          }
        })
      ),
    ];

    return mesureIds
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .flatMap((actionId) => {
        const action = actionsById.get(actionId);
        return action
          ? [{ actionId, identifiant: action.identifiant, nom: action.nom }]
          : [];
      });
  }

  private getExportMode(
    isAuditExport?: boolean,
    snapshotReferences?: string[]
  ): Result<ExportMode, ExportScoreComparisonError> {
    if (isAuditExport) {
      return success(ExportMode.AUDIT);
    }

    const nbRefs = snapshotReferences?.length ?? 0;
    if (nbRefs === 1) {
      return success(ExportMode.SINGLE_SNAPSHOT);
    }
    if (nbRefs > 1) {
      return success(ExportMode.COMPARISON);
    }

    return failure(ExportScoreComparisonErrorEnum.EXPORT_INVALID_MODE);
  }

  private async getSnapshots(
    mode: ExportMode,
    collectiviteId: number,
    referentielId: ReferentielId,
    snapshotReferences?: string[]
  ): Promise<
    Result<
      { snapshot1: ScoreSnapshot; snapshot2: ScoreSnapshot | null },
      ExportScoreComparisonError
    >
  > {
    const snapshotRefsResult = await this.getSnapshotReferences(
      mode,
      collectiviteId,
      referentielId,
      snapshotReferences
    );
    if (!snapshotRefsResult.success) {
      return snapshotRefsResult;
    }
    const { snapshot1Ref, snapshot2Ref } = snapshotRefsResult.data;

    let snapshot1: ScoreSnapshot | null = null;
    let snapshot2: ScoreSnapshot | null = null;

    if (mode === ExportMode.SINGLE_SNAPSHOT) {
      const snapshot1Result =
        snapshot1Ref === SNAPSHOTS.SCORE_COURANT_REF
          ? await this.getCurrentSnapshot(collectiviteId, referentielId)
          : await this.getSnapshot(collectiviteId, referentielId, snapshot1Ref);
      if (!snapshot1Result.success) {
        return snapshot1Result;
      }
      snapshot1 = snapshot1Result.data;
      snapshot2 = null;
    }

    if (mode === ExportMode.COMPARISON || mode === ExportMode.AUDIT) {
      if (!snapshot2Ref) {
        return failure(
          ExportScoreComparisonErrorEnum.EXPORT_SNAPSHOT_REFERENCE_REQUIRED,
          new Error(
            `La référence snapshot2Ref est requise pour l'export de comparaison de deux sauvegardes (collectivité ${collectiviteId}, referentiel ${referentielId})`
          )
        );
      }

      const [snapshot1Result, snapshot2Result] = await Promise.all([
        snapshot1Ref === SNAPSHOTS.SCORE_COURANT_REF
          ? this.getCurrentSnapshot(collectiviteId, referentielId)
          : this.getSnapshot(collectiviteId, referentielId, snapshot1Ref),
        snapshot2Ref === SNAPSHOTS.SCORE_COURANT_REF
          ? this.getCurrentSnapshot(collectiviteId, referentielId)
          : this.getSnapshot(collectiviteId, referentielId, snapshot2Ref),
      ]);

      if (!snapshot1Result.success) {
        return snapshot1Result;
      }
      if (!snapshot2Result.success) {
        return snapshot2Result;
      }

      snapshot1 = snapshot1Result.data;
      snapshot2 = snapshot2Result.data;
    }

    if (!snapshot1) {
      return failure(
        ExportScoreComparisonErrorEnum.EXPORT_SNAPSHOT_NOT_FOUND,
        new Error(
          `Snapshot1 est null pour la collectivité ${collectiviteId}, referentiel ${referentielId}`
        )
      );
    }

    if (mode === ExportMode.COMPARISON && !snapshot2) {
      return failure(
        ExportScoreComparisonErrorEnum.EXPORT_SNAPSHOT_NOT_FOUND,
        new Error(
          `Snapshot2 est null pour la collectivité ${collectiviteId}, referentiel ${referentielId}`
        )
      );
    }

    return success({ snapshot1, snapshot2 });
  }

  private mapSnapshotFailure<T>(
    result: Result<T, SnapshotsError>
  ): Result<never, ExportScoreComparisonError> {
    if (result.success) {
      throw new Error('mapSnapshotFailure called with a successful result');
    }

    if (result.error === SnapshotsErrorEnum.SNAPSHOT_NOT_FOUND) {
      return failure(
        ExportScoreComparisonErrorEnum.EXPORT_SNAPSHOT_NOT_FOUND,
        result.cause
      );
    }

    return failure(
      ExportScoreComparisonErrorEnum.EXPORT_SNAPSHOT_COMPUTE_FAILED,
      result.cause
    );
  }

  private async getSnapshot(
    collectiviteId: number,
    referentielId: ReferentielId,
    snapshotRef: string
  ): Promise<Result<ScoreSnapshot, ExportScoreComparisonError>> {
    const result = await this.snapshotsService.get(
      collectiviteId,
      referentielId,
      snapshotRef
    );

    if (!result.success) {
      return this.mapSnapshotFailure(result);
    }

    return success(result.data);
  }

  private async getCurrentSnapshot(
    collectiviteId: number,
    referentielId: ReferentielId
  ): Promise<Result<ScoreSnapshot, ExportScoreComparisonError>> {
    const result = await this.snapshotsService.computeAndUpsert({
      collectiviteId,
      referentielId,
      jalon: SnapshotJalonEnum.COURANT,
    });

    if (!result.success) {
      return this.mapSnapshotFailure(result);
    }

    return success(result.data);
  }

  private async getSnapshotReferences(
    mode: ExportMode,
    collectiviteId: number,
    referentielId: ReferentielId,
    snapshotReferences?: string[]
  ): Promise<
    Result<
      { snapshot1Ref: string; snapshot2Ref: string | null },
      ExportScoreComparisonError
    >
  > {
    let snapshot1Ref: string | null = null;
    let snapshot2Ref: string | null = null;

    if (
      mode !== ExportMode.AUDIT &&
      mode !== ExportMode.SINGLE_SNAPSHOT &&
      mode !== ExportMode.COMPARISON
    ) {
      return failure(ExportScoreComparisonErrorEnum.EXPORT_INVALID_MODE);
    }

    if (mode === ExportMode.AUDIT) {
      const preAuditRefResult = await this.getOpenedPreAuditSnapshotRef(
        collectiviteId,
        referentielId
      );
      if (!preAuditRefResult.success) {
        return preAuditRefResult;
      }
      snapshot1Ref = preAuditRefResult.data;
      snapshot2Ref = SNAPSHOTS.SCORE_COURANT_REF;
    } else {
      snapshot1Ref = snapshotReferences?.[0] || null;
      snapshot2Ref = snapshotReferences?.[1] || null;
    }

    if (!snapshot1Ref) {
      return failure(
        ExportScoreComparisonErrorEnum.EXPORT_SNAPSHOT_REFERENCE_REQUIRED,
        new Error(
          `La référence snapshot1Ref est requise pour l'export (collectivité ${collectiviteId}, referentiel ${referentielId})`
        )
      );
    }

    return success({ snapshot1Ref, snapshot2Ref });
  }

  /**
   * Agrège les scores en une liste d'actions triées par identifiant
   */
  private transformSnapshotsIntoRows(
    snapshot1: ScoreSnapshot,
    snapshot2: ScoreSnapshot | null,
    excludeDesactive: boolean
  ): ScoreRow[] {
    const snapshot1Scores = snapshot1.scoresPayload.scores;
    const snapshot2Scores = snapshot2?.scoresPayload.scores;
    const s1Rows = flatMapActionsEnfants(snapshot1Scores);
    const s2Rows = snapshot2Scores
      ? flatMapActionsEnfants(snapshot2Scores)
      : null;
    const rows = s1Rows.map((score1) => {
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
    });

    const filteredRows = excludeDesactive
      ? rows.filter((r) => r.score1?.score?.desactive !== true)
      : rows;

    // tri les lignes par actionId (pour éviter d'avoir 1, 10, 2)
    return filteredRows.sort((a, b) => {
      return a.actionId.localeCompare(b.actionId, undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    });
  }

  private async getFichesActionLiees(
    collectiviteId: number,
    mesureIds: ActionId[],
    { user }: { user: AuthUser }
  ): Promise<Record<ActionId, string>> {
    const fichesActionLiees: Record<string, string[]> = {};

    try {
      const { data: fiches } =
        await this.listFichesService.getFichesActionResumes(
          {
            collectiviteId,
            filters: {
              mesureIds,
            },
          },
          { user }
        );

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
  ): Promise<Result<string, ExportScoreComparisonError>> {
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
      return failure(
        ExportScoreComparisonErrorEnum.EXPORT_PRE_AUDIT_SNAPSHOT_NOT_FOUND,
        new Error(
          `No opened pre-audit snapshot found for collectivite ${collectiviteId}, referentiel ${referentielId}`
        )
      );
    }

    return success(openedPreAuditSnapshot.snapshotRef);
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
        .leftJoin(dcpTable, eq(dcpTable.id, auditeurTable.auditeur))
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
      snapshot1.ref === SNAPSHOTS.SCORE_COURANT_REF
    ) {
      snapshot1Label = 'Évaluation dans la plateforme';
    }

    if (
      mode === ExportMode.COMPARISON &&
      snapshot1.ref === SNAPSHOTS.SCORE_COURANT_REF
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
      snapshot2?.ref === SNAPSHOTS.SCORE_COURANT_REF
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
      if (snapshot1.ref === SNAPSHOTS.SCORE_COURANT_REF) {
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
