import { PersonneTagOrUser, Tag } from '@/backend/collectivites/index-domain';
import ListFichesService from '@/backend/plans/fiches/list-fiches/list-fiches.service';
import { HandleMesureServicesService } from '@/backend/referentiels/handle-mesure-services/handle-mesure-services.service';
import { auditeurTable } from '@/backend/referentiels/labellisations/auditeur.table';
import { SnapshotJalonEnum } from '@/backend/referentiels/snapshots/snapshot-jalon.enum';
import { dcpTable } from '@/backend/users/index-domain';
import { DatabaseService } from '@/backend/utils';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { format } from 'date-fns';
import { and, eq } from 'drizzle-orm';
import { Row, Workbook } from 'exceljs';
import { PreuveEssential } from '../../collectivites/documents/models/preuve.dto';
import * as Utils from '../../utils/excel/export-excel.utils';
import { roundTo } from '../../utils/number.utils';
import { GetReferentielService } from '../get-referentiel/get-referentiel.service';
import { HandleMesurePilotesService } from '../handle-mesure-pilotes/handle-mesure-pilotes.service';
import { ActionDefinition, MesureId, ScoreFinalFields } from '../index-domain';
import { auditTable } from '../labellisations/audit.table';
import {
  ActionDefinitionEssential,
  TreeNode,
} from '../models/action-definition.dto';
import {
  StatutAvancement,
  StatutAvancementEnum,
} from '../models/action-statut.table';
import { ActionTypeEnum } from '../models/action-type.enum';
import { ReferentielId } from '../models/referentiel-id.enum';
import { getLevelFromActionId } from '../referentiels.utils';
import { Snapshot, snapshotTable } from '../snapshots/snapshot.table';
import { SnapshotsService } from '../snapshots/snapshots.service';

export type ActionWithScore = TreeNode<
  Pick<ActionDefinition, 'nom' | 'identifiant' | 'categorie'> &
    ActionDefinitionEssential &
    ScoreFinalFields
>;

// couleurs de fond des lignes par axe et sous-axe
const BG_COLORS: Record<number, string[]> = {
  1: ['f7caac', 'fbe4d5'],
  2: ['9bc1e5', 'bdd7ee'],
  3: ['70ae47', 'a9d08e'],
  4: ['fdd966', 'fee699'],
  5: ['8ea9db', 'b5c6e7'],
  6: ['9f5fce', 'bc8fdd'],
};

// couleur de fond ligne sous-sous-axe
const BG_COLOR3 = 'bfbfbf'; // niveau 3
const BG_COLOR4 = 'd8d8d8'; // niveau 4 (CAE seulement)

// Determines the background color of a row based on depth in the tree
export function getRowColor(
  action: { depth: number; identifiant: string },
  referentiel: ReferentielId
) {
  if (action) {
    const { depth, identifiant } = action;
    if (depth === 3) return BG_COLOR3;
    if (depth === 4 && referentiel === 'cae') return BG_COLOR4;

    const axe = parseInt(identifiant.split('.')[0]);
    const colors = BG_COLORS[axe];
    if (colors && depth <= colors.length) return colors[depth - 1];
  }
}

/** Applies numeric formatting to points/scores columns based on the given index (1-based) */
export const setScoreFormats = (row: Row, colIndex: number) => {
  Utils.setCellNumFormat(row.getCell(colIndex));
  Utils.setCellNumFormat(row.getCell(colIndex + 1));
  Utils.setCellNumFormat(row.getCell(colIndex + 2), Utils.FORMAT_PERCENT);
  Utils.setCellNumFormat(row.getCell(colIndex + 3));
  Utils.setCellNumFormat(row.getCell(colIndex + 4), Utils.FORMAT_PERCENT);
  row.getCell(colIndex + 5).style.alignment = Utils.ALIGN_CENTER;
};

@Injectable()
export class ExportScoreComparisonService {
  private readonly logger = new Logger(ExportScoreComparisonService.name);

  // Données courantes pour l'export (non historisées)
  private currentDescriptions: Record<string, string> = {};
  private currentPilotes: Record<string, PersonneTagOrUser[]> = {};
  private currentServices: Record<string, Tag[]> = {};
  private currentFichesActionLiees: Record<string, string> = {};

  // Index (1-based) of all columns
  private readonly COL_INDEX = {
    arbo: 1,
    intitule: 2,
    description: 3,
    phase: 4,
    pilotes: 5,
    services: 6,
    points_max_referentiel: 7,
    pre_audit: {
      points_max_personnalises: 8,
      points_realises: 9,
      score_realise: 10,
      points_programmes: 11,
      score_programme: 12,
      statut: 13,
    },
    courant: {
      points_max_personnalises: 14,
      points_realises: 15,
      score_realise: 16,
      points_programmes: 17,
      score_programme: 18,
      statut: 19,
    },
    commentaires: 20,
    docs: 21,
    fiches_actions_liees: 22,
  };

  private readonly SCORE_HEADER_LABELS = [
    'Potentiel collectivité',
    'Points réalisés',
    '% réalisé',
    'Points programmés',
    '% programmé',
    'statut',
  ];

  private readonly COLUMN_LABELS = [
    'N°',
    'Intitulé',
    'Description',
    'Phase',
    'Personnes pilotes',
    'Services ou Directions pilotes',
    'Potentiel max',
    ...this.SCORE_HEADER_LABELS,
    ...this.SCORE_HEADER_LABELS,
    "Champs de précision de l'état d'avancement",
    'Documents liés',
    'Fiches actions liées',
  ];

  private readonly AUDIT_EXPORT_TITLE = 'Export audit';
  private readonly COMPARISON_EXPORT_TITLE = 'Export comparaison des scores';
  private readonly TOTAL_LABEL = 'Total';

  private readonly SCORE_COURANT = 'score-courant';

  private readonly AVANCEMENT_TO_LABEL: Record<
    StatutAvancement | 'non_concerne',
    string
  > = {
    [StatutAvancementEnum.NON_RENSEIGNE]: 'Non renseigné',
    [StatutAvancementEnum.FAIT]: 'Fait',
    [StatutAvancementEnum.PAS_FAIT]: 'Pas fait',
    [StatutAvancementEnum.DETAILLE]: 'Détaillé',
    [StatutAvancementEnum.PROGRAMME]: 'Programmé',
    [StatutAvancementEnum.NON_CONCERNE]: 'Non concerné',
  };

  constructor(
    private readonly snapshotsService: SnapshotsService,
    private readonly db: DatabaseService,
    private readonly handlePilotesService: HandleMesurePilotesService,
    private readonly handleServicesService: HandleMesureServicesService,
    private readonly getReferentielService: GetReferentielService,
    private readonly listFichesService: ListFichesService
  ) {}

  async exportComparisonScore(
    collectiviteId: number,
    referentielId: ReferentielId,
    isAudit?: boolean,
    snapshotReferences?: string[]
  ): Promise<{ fileName: string; content: Buffer }> {
    if (isAudit) {
      this.logger.log(
        `Export du score d'audit pour la collectivité ${collectiviteId}, referentiel ${referentielId}`
      );
    } else {
      this.logger.log(
        `Export de la comparaison des scores pour la collectivité ${collectiviteId}, referentiel ${referentielId}`
      );
    }

    let snapshot1Ref: string;
    let snapshot2Ref: string;

    if (isAudit) {
      // Find the snapshot-ref associated to the current opened audit
      const [openedPreAuditSnapshot] = await this.db.db
        .select({
          snapshotRef: snapshotTable.ref,
        })
        .from(snapshotTable)
        .leftJoin(auditTable, eq(snapshotTable.auditId, auditTable.id))
        .where(
          and(
            eq(auditTable.collectiviteId, collectiviteId),
            eq(auditTable.clos, false),
            eq(snapshotTable.jalon, SnapshotJalonEnum.PRE_AUDIT),
            eq(snapshotTable.referentielId, referentielId)
          )
        )
        .limit(1);

      if (!openedPreAuditSnapshot) {
        throw new NotFoundException(
          `No opened pre-audit snapshot found for collectivite ${collectiviteId}, referentiel ${referentielId}`
        );
      }

      snapshot1Ref = openedPreAuditSnapshot.snapshotRef;
      snapshot2Ref = this.SCORE_COURANT;
    }

    if (!isAudit && !snapshotReferences?.length) {
      throw new NotFoundException(
        `No snapshot references provided for collectivite ${collectiviteId}, referentiel ${referentielId}`
      );
    }

    if (!isAudit && snapshotReferences) {
      snapshot1Ref = snapshotReferences[0];
      snapshot2Ref = snapshotReferences[1];
    }

    let snapshot1: Snapshot;
    let snapshot2: Snapshot;

    [snapshot1, snapshot2] = await Promise.all([
      this.isScoreCourant(snapshot1Ref!)
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
            snapshot1Ref!
          ),
      this.isScoreCourant(snapshot2Ref!)
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
            snapshot2Ref!
          ),
    ]);

    const collectiviteName = snapshot1.scoresPayload.collectiviteInfo.nom;

    const mesureIds = this.getAllMesureIds(snapshot1.scoresPayload.scores);

    // Fetch additional data (common to both snapshots as they are not historized)

    this.currentDescriptions = await this.getActionDescriptions(referentielId);

    this.currentPilotes = await this.handlePilotesService.listPilotes(
      collectiviteId,
      mesureIds
    );

    this.currentServices = await this.handleServicesService.listServices(
      collectiviteId,
      mesureIds
    );
    this.currentFichesActionLiees = await this.getFichesActionLiees(
      collectiviteId,
      mesureIds
    );

    let auditeurs: { prenom: string | null; nom: string | null }[] = [];
    if (isAudit) {
      // Fetch auditeurs from database
      auditeurs = await this.db.db
        .select({
          prenom: dcpTable.prenom,
          nom: dcpTable.nom,
        })
        .from(auditeurTable)
        .leftJoin(dcpTable, eq(dcpTable.userId, auditeurTable.auditeur))
        .where(eq(auditeurTable.auditId, snapshot1.auditId!));

      if (!auditeurs.length) {
        this.logger.warn(
          `No auditeurs found for collectivite ${collectiviteId}, referentiel ${referentielId}, audit ${snapshot1.auditId}`
        );
      }
    }

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet(
      `${
        isAudit ? this.AUDIT_EXPORT_TITLE : this.COMPARISON_EXPORT_TITLE
      } ${referentielId.toUpperCase()}`
    );

    // adds columns with default width and some exceptions
    worksheet.columns = new Array(this.COL_INDEX.fiches_actions_liees + 1).fill(
      {
        width: 12,
      }
    );
    worksheet.getColumn(this.COL_INDEX.intitule).width = 50;
    worksheet.getColumn(this.COL_INDEX.description).width = 50;
    worksheet.getColumn(this.COL_INDEX.commentaires).width = 50;
    worksheet.getColumn(this.COL_INDEX.docs).width = 50;
    worksheet.getColumn(this.COL_INDEX.fiches_actions_liees).width = 50;

    // Generate header rows
    const { snapshot1Label, snapshot2Label } = this.getSnapshotLabels(
      isAudit ?? false,
      snapshot1Ref!,
      snapshot2Ref!,
      snapshot1,
      snapshot2
    );

    const headerRows = [
      [collectiviteName],
      isAudit && auditeurs.length > 0
        ? [
            'Audit',
            auditeurs?.map(({ prenom, nom }) => `${prenom} ${nom}`).join(' / '),
          ]
        : null,
      ["Date d'export", new Date()],
      // 2 empty lines
      [],
      [],
      // data table header
      [
        ...Utils.makeEmptyCells(this.COL_INDEX.points_max_referentiel),
        snapshot1Label,
        ...Utils.makeEmptyCells(this.SCORE_HEADER_LABELS.length - 1),
        snapshot2Label,
        ,
      ],
      this.COLUMN_LABELS,
    ];

    worksheet.addRows(headerRows);

    // Generate data rows by comparing snapshots
    const rows = this.getSnapshotComparisonRows(
      snapshot1.scoresPayload.scores,
      snapshot2.scoresPayload.scores
    );

    rows.forEach((row) => worksheet.addRow(row));

    // Row indexes
    const rowIndex = {
      // Index of the 2 table header lines
      tableHeader1: headerRows.length - 1,
      tableHeader2: headerRows.length,
      // Index of the first data line
      dataStart: headerRows.length + 1,
    };

    // Merge certain cells
    // Collectivity name
    worksheet.mergeCells('A1:B1');
    // First header line for the two compared snapshots
    worksheet.mergeCells(
      rowIndex.tableHeader1,
      this.COL_INDEX.pre_audit.points_max_personnalises,
      rowIndex.tableHeader1,
      this.COL_INDEX.pre_audit.statut
    );
    worksheet.mergeCells(
      rowIndex.tableHeader1,
      this.COL_INDEX.courant.points_max_personnalises,
      rowIndex.tableHeader1,
      this.COL_INDEX.courant.statut
    );

    // Add styles to certain columns and cells
    worksheet.getColumn(this.COL_INDEX.intitule).alignment =
      Utils.ALIGN_LEFT_WRAP;
    worksheet.getColumn(this.COL_INDEX.description).alignment =
      Utils.ALIGN_LEFT_WRAP;
    worksheet.getColumn(this.COL_INDEX.commentaires).alignment =
      Utils.ALIGN_LEFT_WRAP;
    worksheet.getColumn(this.COL_INDEX.docs).alignment = Utils.ALIGN_LEFT_WRAP;
    worksheet.getColumn(this.COL_INDEX.fiches_actions_liees).alignment =
      Utils.ALIGN_LEFT_WRAP;
    worksheet.getColumn(this.COL_INDEX.points_max_referentiel).font =
      Utils.ITALIC;
    if (this.COL_INDEX.phase) {
      worksheet.getColumn(this.COL_INDEX.phase).alignment = Utils.ALIGN_CENTER;
    }
    worksheet.getCell('A1').fill = Utils.FILL.grey;
    worksheet.getCell('B2').fill = Utils.FILL.yellow;
    worksheet.getCell('B3').fill = Utils.FILL.yellow;
    worksheet.getCell('B3').numFmt = 'dd/mm/yyyy';
    worksheet.getCell(
      rowIndex.tableHeader1,
      this.COL_INDEX.pre_audit.points_max_personnalises
    ).style = Utils.HEADING1;
    worksheet.getCell(
      rowIndex.tableHeader1,
      this.COL_INDEX.courant.points_max_personnalises
    ).style = Utils.HEADING1;
    Utils.setCellsStyle(
      worksheet,
      rowIndex.tableHeader2,
      this.COL_INDEX.arbo,
      this.COL_INDEX.fiches_actions_liees,
      Utils.HEADING2
    );
    Utils.setCellsStyle(
      worksheet,
      rowIndex.tableHeader2,
      this.COL_INDEX.pre_audit.points_max_personnalises,
      this.COL_INDEX.commentaires - 1,
      Utils.HEADING_SCORES
    );
    worksheet.getCell(
      rowIndex.tableHeader2,
      this.COL_INDEX.points_max_referentiel
    ).font = { bold: true, italic: true };
    worksheet.getCell(
      rowIndex.tableHeader2,
      this.COL_INDEX.pre_audit.points_max_personnalises
    ).border.left = Utils.BORDER_MEDIUM;
    worksheet.getCell(
      rowIndex.tableHeader2,
      this.COL_INDEX.courant.statut
    ).border.right = Utils.BORDER_MEDIUM;

    // Apply styles to data rows
    rows.forEach((_, index) => {
      const r = rowIndex.dataStart + index;
      const row = worksheet.getRow(r);

      const actionId = row.getCell(this.COL_INDEX.arbo).value as string;

      if (actionId === this.TOTAL_LABEL) {
        // ligne "total"
        Utils.setCellsStyle(
          worksheet,
          r,
          this.COL_INDEX.arbo,
          this.COL_INDEX.fiches_actions_liees,
          {
            font: Utils.BOLD,
          }
        );
      } else {
        // niveau de profondeur (case plier/déplier)
        const depth = getLevelFromActionId(actionId);
        if (depth > 1) {
          row.outlineLevel = depth;
        }

        // background color
        const color = getRowColor(
          {
            depth,
            identifiant: actionId,
          },
          referentielId
        );

        if (color) {
          row.fill = Utils.makeSolidFill(color);
        }
      }

      // Numeric formatting for points/scores
      Utils.setCellNumFormat(
        row.getCell(this.COL_INDEX.pre_audit.points_max_personnalises - 1)
      );
      setScoreFormats(row, this.COL_INDEX.pre_audit.points_max_personnalises);
      setScoreFormats(row, this.COL_INDEX.courant.points_max_personnalises);
    });

    const buffer = await workbook.xlsx.writeBuffer();

    const exportedAt = format(new Date(), 'yyyy-MM-dd');

    const fileName = isAudit
      ? `Export_audit_${collectiviteName}_${exportedAt}.xlsx`
      : `Export_comparaison_${referentielId}_${collectiviteName}_${exportedAt}.xlsx`;

    return {
      fileName,
      content: buffer as Buffer,
    };
  }

  private getSnapshotComparisonRows(
    preAuditScores: ActionWithScore,
    currentScores: ActionWithScore
  ): (string | number | null)[][] {
    const rows: (string | number | null)[][] = [];
    this.traverseActionTree(preAuditScores, currentScores, rows);
    return rows;
  }

  private traverseActionTree(
    preAuditAction: ActionWithScore | null,
    currentAction: ActionWithScore | null,
    rows: (string | number | null)[][],
    depth = 0,
    parentPreAuditAction: ActionWithScore | null = null,
    parentCurrentAction: ActionWithScore | null = null
  ): void {
    // Add current action row
    rows.push(
      this.getSnapshotComparisonRow(
        preAuditAction,
        currentAction,
        parentPreAuditAction,
        parentCurrentAction
      )
    );

    // Recursively process child actions
    const preAuditChildren = preAuditAction?.actionsEnfant || [];
    const currentChildren = currentAction?.actionsEnfant || [];
    const maxChildren = Math.max(
      preAuditChildren.length,
      currentChildren.length
    );

    for (let i = 0; i < maxChildren; i++) {
      const preAuditChild = preAuditChildren[i];
      const currentChild = currentChildren[i];

      if (preAuditChild && currentChild) {
        this.traverseActionTree(
          preAuditChild,
          currentChild,
          rows,
          depth + 1,
          preAuditAction,
          currentAction
        );
      } else if (preAuditChild) {
        // Action was removed
        rows.push(
          this.getSnapshotComparisonRow(
            preAuditChild,
            null,
            preAuditAction,
            null
          )
        );
      } else if (currentChild) {
        // Action was added
        rows.push(
          this.getSnapshotComparisonRow(null, currentChild, null, currentAction)
        );
      }
    }
  }

  private getSnapshotComparisonRow(
    preAuditAction: ActionWithScore | null,
    currentAction: ActionWithScore | null,
    parentPreAuditAction: ActionWithScore | null = null,
    parentCurrentAction: ActionWithScore | null = null
  ): (string | number | null)[] {
    const actionId =
      preAuditAction?.identifiant || currentAction?.identifiant || '';
    const actionIdForData =
      preAuditAction?.actionId || currentAction?.actionId || '';
    const actionName = preAuditAction?.nom || currentAction?.nom || '';
    const phase = preAuditAction?.categorie || currentAction?.categorie || '';
    const pointsMaxReferentiel =
      preAuditAction?.score?.pointReferentiel ||
      currentAction?.score?.pointReferentiel ||
      null;

    // Check if this is the total row (referentiel root action)
    const isTotalRow =
      preAuditAction?.actionType === ActionTypeEnum.REFERENTIEL ||
      currentAction?.actionType === ActionTypeEnum.REFERENTIEL;

    // Pre-audit data
    const preAuditPointsMaxPersonnalises =
      preAuditAction?.score?.pointPotentiel || null;
    const preAuditPointsRealises = preAuditAction?.score?.pointFait || null;
    const preAuditScoreRealise =
      preAuditPointsRealises && preAuditPointsMaxPersonnalises
        ? roundTo(preAuditPointsRealises / preAuditPointsMaxPersonnalises, 2)
        : null;
    const preAuditPointsProgrammes =
      preAuditAction?.score?.pointProgramme || null;
    const preAuditScoreProgramme =
      preAuditPointsProgrammes && preAuditPointsMaxPersonnalises
        ? roundTo(preAuditPointsProgrammes / preAuditPointsMaxPersonnalises, 2)
        : null;
    const preAuditStatut = preAuditAction
      ? this.formatActionStatut(
          preAuditAction,
          parentPreAuditAction ? parentPreAuditAction : undefined
        )
      : '';

    // Current data
    const currentPointsMaxPersonnalises =
      currentAction?.score?.pointPotentiel || null;
    const currentPointsRealises = currentAction?.score?.pointFait || null;
    const currentScoreRealise =
      currentPointsRealises && currentPointsMaxPersonnalises
        ? roundTo(currentPointsRealises / currentPointsMaxPersonnalises, 2)
        : null;
    const currentPointsProgrammes =
      currentAction?.score?.pointProgramme || null;
    const currentScoreProgramme =
      currentPointsProgrammes && currentPointsMaxPersonnalises
        ? roundTo(currentPointsProgrammes / currentPointsMaxPersonnalises, 2)
        : null;
    const currentStatut = currentAction
      ? this.formatActionStatut(
          currentAction,
          parentCurrentAction ? parentCurrentAction : undefined
        )
      : '';

    // Comments and docs
    const commentaires =
      preAuditAction?.score?.explication ||
      currentAction?.score?.explication ||
      '';
    const docs =
      this.formatPreuves(preAuditAction?.preuves || currentAction?.preuves) ||
      '';

    return [
      // arbo (identifiant) - use TOTAL_LABEL for total row
      isTotalRow ? this.TOTAL_LABEL : actionId,
      // intitule (nom) - empty for total row
      isTotalRow ? '' : actionName,
      // description
      isTotalRow ? '' : this.currentDescriptions[actionIdForData] || '',
      // phase (categorie)
      Utils.capitalize(phase),
      // pilotes
      isTotalRow
        ? ''
        : this.currentPilotes[actionIdForData]?.map((p) => p.nom).join(', ') ||
          '',
      // services
      isTotalRow
        ? ''
        : this.currentServices[actionIdForData]?.map((s) => s.nom).join(', ') ||
          '',
      // points_max_referentiel
      pointsMaxReferentiel,
      // pre_audit data
      preAuditPointsMaxPersonnalises,
      preAuditPointsRealises,
      preAuditScoreRealise,
      preAuditPointsProgrammes,
      preAuditScoreProgramme,
      preAuditStatut,
      // courant data
      currentPointsMaxPersonnalises,
      currentPointsRealises,
      currentScoreRealise,
      currentPointsProgrammes,
      currentScoreProgramme,
      currentStatut,
      // commentaires
      commentaires,
      // docs
      docs,
      // fiches actions liées
      isTotalRow ? '' : this.currentFichesActionLiees[actionIdForData] || '',
    ];
  }

  formatActionStatut(
    actionScore: ActionWithScore | undefined,
    parentActionScore: ActionWithScore | undefined
  ): string {
    // no status if data is not available or if the item is neither a "sous-action" nor a "tâche"
    if (
      !actionScore ||
      (actionScore.actionType !== ActionTypeEnum.SOUS_ACTION &&
        actionScore.actionType !== ActionTypeEnum.TACHE)
    ) {
      return '';
    }

    // Display "non concerné" for an item with this status or being disabled
    const { concerne, desactive, avancement } = actionScore.score;
    if (!concerne || desactive) {
      return 'Non concerné';
    }

    // To avoid displaying "non renseigné" for a "tâche" without status but having a status on the "sous-action"
    if (
      (actionScore.actionType === ActionTypeEnum.TACHE &&
        !actionScore.score.avancement &&
        parentActionScore &&
        parentActionScore?.score?.avancement !== 'non_renseigne' &&
        parentActionScore?.score?.avancement !== 'detaille') ||
      !parentActionScore?.score?.concerne
    ) {
      return '';
    }

    // To avoid displaying "non renseigné" for a "sous-action" where at least one "tâche" is filled
    const hasChildrenAvancement = actionScore.actionsEnfant?.some(
      (actionScoreEnfant) =>
        actionScoreEnfant.score?.avancement &&
        actionScoreEnfant.score?.avancement !== 'non_renseigne'
    );
    if (
      actionScore.actionType === ActionTypeEnum.SOUS_ACTION &&
      (!actionScore.score.avancement ||
        actionScore.score.avancement === 'non_renseigne' ||
        actionScore.score.avancement === 'detaille') &&
      hasChildrenAvancement
    ) {
      return this.AVANCEMENT_TO_LABEL['detaille'];
    }

    // Display "non renseigné" if advancement is not filled
    if (!avancement || !this.AVANCEMENT_TO_LABEL[avancement]) {
      return this.AVANCEMENT_TO_LABEL['non_renseigne'];
    }

    // Display the label corresponding to the advancement
    return this.AVANCEMENT_TO_LABEL[avancement];
  }

  formatPreuves(preuves?: PreuveEssential[]): string | undefined {
    return preuves
      ?.map((p) => p?.url || p?.filename || null)
      .filter((s) => !!s)
      .join('\n');
  }

  private getAllMesureIds(actionScore: ActionWithScore): MesureId[] {
    const ids: MesureId[] = [];
    if (actionScore.actionId) {
      ids.push(actionScore.actionId);
    }
    actionScore.actionsEnfant?.forEach((child) => {
      ids.push(...this.getAllMesureIds(child));
    });
    return ids;
  }

  private async getActionDescriptions(
    referentielId: ReferentielId
  ): Promise<Record<MesureId, string>> {
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
    mesureIds: MesureId[]
  ): Promise<Record<MesureId, string>> {
    const fichesActionLiees: Record<string, string[]> = {};

    try {
      const fiches = await this.listFichesService.getFichesAction(
        collectiviteId,
        { mesureIds }
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

    // Sort fiches alphabetically and format them
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

  private isScoreCourant(snapshotReference: string) {
    console.log('snapshotReference', snapshotReference);
    return snapshotReference === this.SCORE_COURANT;
  }

  private getSnapshotLabels(
    isAudit: boolean,
    snapshot1Ref: string,
    snapshot2Ref: string,
    snapshot1: Snapshot,
    snapshot2: Snapshot
  ): { snapshot1Label: string; snapshot2Label: string } {
    let snapshot1Label: string;
    if (isAudit) {
      snapshot1Label = 'Proposé avant audit dans la plateforme';
    } else if (this.isScoreCourant(snapshot1Ref)) {
      snapshot1Label = 'État des lieux actuel';
    } else {
      snapshot1Label = snapshot1.nom;
    }

    let snapshot2Label: string;
    if (isAudit) {
      snapshot2Label = 'Audité dans la plateforme';
    } else if (this.isScoreCourant(snapshot2Ref)) {
      snapshot2Label = 'État des lieux actuel';
    } else {
      snapshot2Label = snapshot2.nom;
    }

    return { snapshot1Label, snapshot2Label };
  }
}
