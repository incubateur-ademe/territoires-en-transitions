import { auditeurTable } from '@/backend/referentiels/labellisations/auditeur.table';
import { SnapshotJalonEnum } from '@/backend/referentiels/snapshots/snapshot-jalon.enum';
import { dcpTable } from '@/backend/users/index-domain';
import { DatabaseService } from '@/backend/utils';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { format } from 'date-fns';
import { and, eq } from 'drizzle-orm';
import { Row, Workbook } from 'exceljs';
import { PreuveEssential } from '../../collectivites/documents/models/preuve.dto';
import * as Utils from '../../utils/excel/export-excel.utils';
import { roundTo } from '../../utils/number.utils';
import { ActionDefinition, ScoreFinalFields } from '../index-domain';
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
import { snapshotTable } from '../snapshots/snapshot.table';
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

// détermine la couleur de fond d'une ligne en fonction de la profondeur dans l'arbo
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

/** applique le formatage numérique aux colonnes points/scores à partir de l'index (base 1) donné */
export const setScoreFormats = (row: Row, colIndex: number) => {
  Utils.setCellNumFormat(row.getCell(colIndex));
  Utils.setCellNumFormat(row.getCell(colIndex + 1));
  Utils.setCellNumFormat(row.getCell(colIndex + 2), Utils.FORMAT_PERCENT);
  Utils.setCellNumFormat(row.getCell(colIndex + 3));
  Utils.setCellNumFormat(row.getCell(colIndex + 4), Utils.FORMAT_PERCENT);
  row.getCell(colIndex + 5).style.alignment = Utils.ALIGN_CENTER;
};

@Injectable()
export class ExportScoreComparaisonService {
  private readonly logger = new Logger(ExportScoreComparaisonService.name);

  // index (base 1) de toutes les colonnes
  private readonly AUDIT_COL_INDEX = {
    arbo: 1,
    intitule: 2,
    phase: 3,
    points_max_referentiel: 4,
    pre_audit: {
      points_max_personnalises: 5,
      points_realises: 6,
      score_realise: 7,
      points_programmes: 8,
      score_programme: 9,
      statut: 10,
    },
    courant: {
      points_max_personnalises: 11,
      points_realises: 12,
      score_realise: 13,
      points_programmes: 14,
      score_programme: 15,
      statut: 16,
    },
    commentaires: 17,
    docs: 18,
  };

  private readonly AUDIT_SCORE_HEADER_LABELS = [
    'Potentiel collectivité',
    'Points réalisés',
    '% réalisé',
    'Points programmés',
    '% programmé',
    'statut',
  ];

  private readonly AUDIT_COLUMN_LABELS = [
    '', // identifiant action
    '', // intitulé action
    'Phase',
    'Potentiel max',
    ...this.AUDIT_SCORE_HEADER_LABELS,
    ...this.AUDIT_SCORE_HEADER_LABELS,
    "Champs de précision de l'état d'avancement",
    'Documents liés',
  ];

  private readonly AUDIT_EXPORT_TITLE = 'Export audit';
  private readonly TOTAL_LABEL = 'Total';

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
    private readonly db: DatabaseService
  ) {}

  async exportAuditScore(
    collectiviteId: number,
    referentielId: ReferentielId
  ): Promise<{ fileName: string; content: Buffer }> {
    this.logger.log(
      `Exporting audit score for collectivite ${collectiviteId}, referentiel ${referentielId}`
    );

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

    // Fetch both pre-audit and current snapshots
    const [preAuditSnapshot, currentSnapshot] = await Promise.all([
      this.snapshotsService.get(
        collectiviteId,
        referentielId,
        openedPreAuditSnapshot.snapshotRef
      ),

      // Force recompute of the current snapshot to be sure to have the latest version,
      // especially because we need mesures explications and preuves to be present in the current snapshot,
      // but when the user edit them, it doesn't currently trigger a snapshot update
      this.snapshotsService.computeAndUpsert({
        collectiviteId,
        referentielId,
        jalon: SnapshotJalonEnum.COURANT,
      }),
    ]);

    if (!preAuditSnapshot || !currentSnapshot) {
      throw new NotFoundException(
        `Missing snapshots for collectivite ${collectiviteId}, referentiel ${referentielId}`
      );
    }

    if (!preAuditSnapshot.auditId) {
      throw new InternalServerErrorException(
        `Missing audit id for collectivite ${collectiviteId}, referentiel ${referentielId}`
      );
    }

    // Fetch auditeurs from database
    const auditeurs = await this.db.db
      .select({
        prenom: dcpTable.prenom,
        nom: dcpTable.nom,
      })
      .from(auditeurTable)
      .leftJoin(dcpTable, eq(dcpTable.userId, auditeurTable.auditeur))
      .where(eq(auditeurTable.auditId, preAuditSnapshot.auditId));

    if (!auditeurs.length) {
      this.logger.warn(
        `No auditeurs found for collectivite ${collectiviteId}, referentiel ${referentielId}, audit ${preAuditSnapshot.auditId}`
      );
    }

    const collectiviteName = currentSnapshot.scoresPayload.collectiviteInfo.nom;

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet(
      `${this.AUDIT_EXPORT_TITLE} ${referentielId.toUpperCase()}`
    );

    // ajoute les colonnes avec une largeur par défaut et quelques exceptions
    worksheet.columns = new Array(this.AUDIT_COL_INDEX.docs + 1).fill({
      width: 12,
    });
    worksheet.getColumn(this.AUDIT_COL_INDEX.intitule).width = 50;
    worksheet.getColumn(this.AUDIT_COL_INDEX.commentaires).width = 50;
    worksheet.getColumn(this.AUDIT_COL_INDEX.docs).width = 50;

    // génère les lignes d'en-tête
    const headerRows = [
      [collectiviteName],
      [
        'Audit',
        auditeurs?.map(({ prenom, nom }) => `${prenom} ${nom}`).join(' / '),
      ],
      ["Date d'export", new Date()],
      // 2 lignes vides
      [],
      [],
      // en-tête du tableau de données
      [
        ...Utils.makeEmptyCells(this.AUDIT_COL_INDEX.points_max_referentiel),
        'Proposé avant audit dans la plateforme',
        ...Utils.makeEmptyCells(this.AUDIT_SCORE_HEADER_LABELS.length - 1),
        'Audité dans la plateforme',
      ],
      this.AUDIT_COLUMN_LABELS,
    ];

    worksheet.addRows(headerRows);

    // Generate data rows by comparing pre-audit and current snapshots
    const rows = this.getAuditComparisonRows(
      preAuditSnapshot.scoresPayload.scores as ActionWithScore,
      currentSnapshot.scoresPayload.scores as ActionWithScore
    );

    rows.forEach((row) => worksheet.addRow(row));

    // index des lignes
    const rowIndex = {
      // index des 2 lignes d'en-tête du tableau
      tableHeader1: headerRows.length - 1,
      tableHeader2: headerRows.length,
      // index de la 1ère ligne de données
      dataStart: headerRows.length + 1,
    };

    // fusionne certaines cellules
    // nom de la collectivité
    worksheet.mergeCells('A1:B1');
    // 1ère ligne d'en-tête des scores avant/après audit
    worksheet.mergeCells(
      rowIndex.tableHeader1,
      this.AUDIT_COL_INDEX.pre_audit.points_max_personnalises,
      rowIndex.tableHeader1,
      this.AUDIT_COL_INDEX.pre_audit.statut
    );
    worksheet.mergeCells(
      rowIndex.tableHeader1,
      this.AUDIT_COL_INDEX.courant.points_max_personnalises,
      rowIndex.tableHeader1,
      this.AUDIT_COL_INDEX.courant.statut
    );

    // ajoute des styles à certaines colonnes et cellules
    worksheet.getColumn(this.AUDIT_COL_INDEX.intitule).alignment =
      Utils.ALIGN_LEFT_WRAP;
    worksheet.getColumn(this.AUDIT_COL_INDEX.commentaires).alignment =
      Utils.ALIGN_LEFT_WRAP;
    worksheet.getColumn(this.AUDIT_COL_INDEX.docs).alignment =
      Utils.ALIGN_LEFT_WRAP;
    worksheet.getColumn(this.AUDIT_COL_INDEX.points_max_referentiel).font =
      Utils.ITALIC;
    if (this.AUDIT_COL_INDEX.phase) {
      worksheet.getColumn(this.AUDIT_COL_INDEX.phase).alignment =
        Utils.ALIGN_CENTER;
    }
    worksheet.getCell('A1').fill = Utils.FILL.grey;
    worksheet.getCell('B2').fill = Utils.FILL.yellow;
    worksheet.getCell('B3').fill = Utils.FILL.yellow;
    worksheet.getCell('B3').numFmt = 'dd/mm/yyyy';
    worksheet.getCell(
      rowIndex.tableHeader1,
      this.AUDIT_COL_INDEX.pre_audit.points_max_personnalises
    ).style = Utils.HEADING1;
    worksheet.getCell(
      rowIndex.tableHeader1,
      this.AUDIT_COL_INDEX.courant.points_max_personnalises
    ).style = Utils.HEADING1;
    Utils.setCellsStyle(
      worksheet,
      rowIndex.tableHeader2,
      this.AUDIT_COL_INDEX.arbo,
      this.AUDIT_COL_INDEX.docs,
      Utils.HEADING2
    );
    Utils.setCellsStyle(
      worksheet,
      rowIndex.tableHeader2,
      this.AUDIT_COL_INDEX.pre_audit.points_max_personnalises,
      this.AUDIT_COL_INDEX.commentaires - 1,
      Utils.HEADING_SCORES
    );
    worksheet.getCell(
      rowIndex.tableHeader2,
      this.AUDIT_COL_INDEX.points_max_referentiel
    ).font = { bold: true, italic: true };
    worksheet.getCell(
      rowIndex.tableHeader2,
      this.AUDIT_COL_INDEX.pre_audit.points_max_personnalises
    ).border.left = Utils.BORDER_MEDIUM;
    worksheet.getCell(
      rowIndex.tableHeader2,
      this.AUDIT_COL_INDEX.courant.statut
    ).border.right = Utils.BORDER_MEDIUM;

    // applique les styles aux lignes de données
    rows.forEach((_, index) => {
      const r = rowIndex.dataStart + index;
      const row = worksheet.getRow(r);

      const actionId = row.getCell(this.AUDIT_COL_INDEX.arbo).value as string;

      if (actionId === this.TOTAL_LABEL) {
        // ligne "total"
        Utils.setCellsStyle(
          worksheet,
          r,
          this.AUDIT_COL_INDEX.arbo,
          this.AUDIT_COL_INDEX.docs,
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

        // couleur de fond
        const color = getRowColor(
          {
            depth,
            identifiant: actionId,
          },
          referentielId
        );

        this.logger.log(
          `actionId: ${actionId}, color: ${color}, depth: ${depth}`
        );

        if (color) {
          row.fill = Utils.makeSolidFill(color);
        }
      }

      // formatage numérique des points/scores
      Utils.setCellNumFormat(
        row.getCell(this.AUDIT_COL_INDEX.pre_audit.points_max_personnalises - 1)
      );
      setScoreFormats(
        row,
        this.AUDIT_COL_INDEX.pre_audit.points_max_personnalises
      );
      setScoreFormats(
        row,
        this.AUDIT_COL_INDEX.courant.points_max_personnalises
      );
    });

    const buffer = await workbook.xlsx.writeBuffer();

    const exportedAt = format(new Date(), 'yyyy-MM-dd');
    const fileName = `Export_audit_${collectiviteName}_${exportedAt}.xlsx`;

    return {
      fileName,
      content: buffer as Buffer,
    };
  }

  private getAuditComparisonRows(
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
      this.getAuditComparisonRow(
        preAuditAction,
        currentAction,
        depth,
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
          this.getAuditComparisonRow(
            preAuditChild,
            null,
            depth + 1,
            preAuditAction,
            null
          )
        );
      } else if (currentChild) {
        // Action was added
        rows.push(
          this.getAuditComparisonRow(
            null,
            currentChild,
            depth + 1,
            null,
            currentAction
          )
        );
      }
    }
  }

  private getAuditComparisonRow(
    preAuditAction: ActionWithScore | null,
    currentAction: ActionWithScore | null,
    depth: number,
    parentPreAuditAction: ActionWithScore | null = null,
    parentCurrentAction: ActionWithScore | null = null
  ): (string | number | null)[] {
    const actionId =
      preAuditAction?.identifiant || currentAction?.identifiant || '';
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

    // Commentaires and docs
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
      // phase (categorie)
      Utils.capitalize(phase),
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
    ];
  }

  formatActionStatut(
    actionScore: ActionWithScore | undefined,
    parentActionScore: ActionWithScore | undefined
  ): string {
    // pas de statut si les données ne sont pas disponibles ou que l'item n'est ni une sous-action ni une tâche
    if (
      !actionScore ||
      (actionScore.actionType !== ActionTypeEnum.SOUS_ACTION &&
        actionScore.actionType !== ActionTypeEnum.TACHE)
    ) {
      return '';
    }

    // affiche "non concerné" pour un item ayant ce statut ou étant désactivé
    const { concerne, desactive, avancement } = actionScore.score;
    if (!concerne || desactive) {
      return 'Non concerné';
    }

    // pour éviter d'afficher "non renseigné" pour une tâche sans statut mais ayant un statut à la sous-action
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

    // pour éviter d'afficher "non renseigné" pour une sous-action dont au moins une tâche est renseignée
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

    // affiche "non renseigné" si l'avancement n'est pas renseigné
    if (!avancement || !this.AVANCEMENT_TO_LABEL[avancement]) {
      return this.AVANCEMENT_TO_LABEL['non_renseigne'];
    }

    // affiche le libellé correspondant à l'avancement
    return this.AVANCEMENT_TO_LABEL[avancement];
  }

  formatPreuves(preuves?: PreuveEssential[]): string | undefined {
    return preuves
      ?.map((p) => p?.url || p?.filename || null)
      .filter((s) => !!s)
      .join('\n');
  }
}
