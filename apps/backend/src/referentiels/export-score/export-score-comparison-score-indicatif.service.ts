/** Variante derrière feature flag contenant les colonnes "score lié à un indicateur" */

import { PersonneTagOrUser } from '@/backend/collectivites/shared/models/personne-tag-or-user.dto';
import { Tag } from '@/backend/collectivites/tags/tag.table-base';
import ListFichesService from '@/backend/plans/fiches/list-fiches/list-fiches.service';
import { ScoreFinalFields } from '@/backend/referentiels/compute-score/score.dto';
import { ExportScoreComparisonRequestQuery } from '@/backend/referentiels/export-score/export-score-comparison.request';
import { HandleMesureServicesService } from '@/backend/referentiels/handle-mesure-services/handle-mesure-services.service';
import { auditeurTable } from '@/backend/referentiels/labellisations/auditeur.table';
import {
  ActionDefinition,
  MesureId,
} from '@/backend/referentiels/models/action-definition.table';
import { getLibelleScoreIndicatif } from '@/backend/referentiels/score-indicatif/format-score-indicatif.utils';
import { SnapshotJalonEnum } from '@/backend/referentiels/snapshots/snapshot-jalon.enum';
import { dcpTable } from '@/backend/users/models/dcp.table';
import { DatabaseService } from '@/backend/utils';
import { htmlToText } from '@/backend/utils/html-to-text.utils';
import { unaccent } from '@/backend/utils/unaccent.utils';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { format } from 'date-fns';
import { and, desc, eq } from 'drizzle-orm';
import { Alignment, Column, Row, Workbook } from 'exceljs';
import { PreuveEssential } from '../../collectivites/documents/models/preuve.dto';
import * as Utils from '../../utils/excel/export-excel.utils';
import { roundTo } from '../../utils/number.utils';
import { GetReferentielService } from '../get-referentiel/get-referentiel.service';
import { HandleMesurePilotesService } from '../handle-mesure-pilotes/handle-mesure-pilotes.service';
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

type CommonData = {
  descriptions: Record<string, string>;
  pilotes: Record<string, PersonneTagOrUser[]>;
  services: Record<string, Tag[]>;
  fichesActionLiees: Record<string, string>;
};

type ExportFormat = 'excel' | 'csv';

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
function getRowColor(
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
const setScoreFormats = (row: Row, colIndex: number) => {
  Utils.setCellNumFormat(row.getCell(colIndex));
  Utils.setCellNumFormat(row.getCell(colIndex + 1));
  Utils.setCellNumFormat(row.getCell(colIndex + 2), Utils.FORMAT_PERCENT);
  Utils.setCellNumFormat(row.getCell(colIndex + 3));
  Utils.setCellNumFormat(row.getCell(colIndex + 4), Utils.FORMAT_PERCENT);
  Utils.setCellNumFormat(row.getCell(colIndex + 5));
  Utils.setCellNumFormat(row.getCell(colIndex + 6), Utils.FORMAT_PERCENT);
  Utils.setCellNumFormat(row.getCell(colIndex + 7), Utils.FORMAT_PERCENT);
  row.getCell(colIndex + 5).style.alignment = Utils.ALIGN_CENTER;
  row.getCell(colIndex + 6).style.alignment = Utils.ALIGN_CENTER;
  row.getCell(colIndex + 7).style.alignment = Utils.ALIGN_CENTER;
};

enum ExportMode {
  AUDIT = 'audit',
  SINGLE_SNAPSHOT = 'single_snapshot',
  COMPARISON = 'comparison',
}

@Injectable()
export class ExportScoreComparisonScoreIndicatifService {
  private readonly logger = new Logger(
    ExportScoreComparisonScoreIndicatifService.name
  );

  // Index (1-based) of all columns for single snapshot mode
  private readonly SINGLE_SNAPSHOT_COL_INDEX = {
    arbo: 1,
    intitule: 2,
    description: 3,
    phase: 4,
    points_max_referentiel: 5,
    snapshot: {
      points_max_personnalises: 6,
      points_realises: 7,
      score_realise: 8,
      points_programmes: 9,
      score_programme: 10,
      points_pas_faits: 11,
      score_pas_faits: 12,
      statut: 13,
      commentaires: 14,
      score_indicatif: 15,
    },
    pilotes: 16,
    services: 17,
    docs: 18,
    fiches_actions_liees: 19,
  };

  // Index (1-based) of all columns
  private readonly TWO_SNAPSHOTS_COL_INDEX = {
    arbo: 1,
    intitule: 2,
    description: 3,
    phase: 4,
    points_max_referentiel: 5,
    snapshot1: {
      points_max_personnalises: 6,
      points_realises: 7,
      score_realise: 8,
      points_programmes: 9,
      score_programme: 10,
      points_pas_faits: 11,
      score_pas_faits: 12,
      statut: 13,
      commentaires: 14,
      score_indicatif: 15,
    },
    snapshot2: {
      points_max_personnalises: 16,
      points_realises: 17,
      score_realise: 18,
      points_programmes: 19,
      score_programme: 20,
      points_pas_faits: 21,
      score_pas_faits: 22,
      statut: 23,
      commentaires: 24,
      score_indicatif: 25,
    },
    pilotes: 26,
    services: 27,
    docs: 28,
    fiches_actions_liees: 29,
  };

  private readonly SCORE_HEADER_LABELS = [
    'Potentiel collectivité',
    'Points réalisés',
    '% réalisé',
    'Points programmés',
    '% programmé',
    'Points pas faits',
    '% pas fait',
    'Statut',
    "Champs de précision de l'état d'avancement",
    'Score lié à un indicateur',
  ];

  private readonly SINGLE_SNAPSHOT_COLUMN_LABELS = [
    'N°',
    'Intitulé',
    'Description',
    'Phase',
    'Potentiel max',
    ...this.SCORE_HEADER_LABELS,
    'Personnes pilotes',
    'Services ou Directions pilotes',
    'Documents liés',
    'Fiches actions liées',
  ];

  private readonly TWO_SNAPSHOTS_COLUMN_LABELS = [
    'N°',
    'Intitulé',
    'Description',
    'Phase',
    'Potentiel max',
    ...this.SCORE_HEADER_LABELS,
    ...this.SCORE_HEADER_LABELS,
    'Personnes pilotes',
    'Services ou Directions pilotes',
    'Documents liés',
    'Fiches actions liées',
  ];

  private readonly EXPORT_TITLES: Record<string, string> = {
    audit: 'Export audit',
    singleSnapshot: 'Export état des lieux actuel',
    comparison: 'Export comparaison des sauvegardes',
  };

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

  private readonly TOTAL_LABEL = 'Total';

  private readonly SCORE_COURANT = 'score-courant';

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
    query: ExportScoreComparisonRequestQuery
  ): Promise<{ fileName: string; content: Buffer }> {
    const {
      exportFormat,
      snapshotReferences,
      isAudit,
      isScoreIndicatifEnabled,
    } = query;
    const mode = this.getExportMode(isAudit, snapshotReferences);

    if (mode === ExportMode.SINGLE_SNAPSHOT) {
      this.logger.log(
        `Export de l'état des lieux actuel pour la collectivité ${collectiviteId}, referentiel ${referentielId}`
      );
    } else if (mode === ExportMode.AUDIT) {
      this.logger.log(
        `Export du score d'audit pour la collectivité ${collectiviteId}, referentiel ${referentielId}`
      );
    } else if (mode === ExportMode.COMPARISON) {
      this.logger.log(
        `Export de la comparaison des scores pour la collectivité ${collectiviteId}, referentiel ${referentielId}`
      );
    }

    if (
      mode !== ExportMode.AUDIT &&
      (!snapshotReferences || !snapshotReferences.length)
    ) {
      throw new NotFoundException(
        `Pas de référence de snapshot fournie pour la collectivité ${collectiviteId}, referentiel ${referentielId}`
      );
    }

    const { snapshot1, snapshot2 } = await this.getSnapshots(
      mode,
      collectiviteId,
      referentielId,
      snapshotReferences
    );

    const collectiviteName = snapshot1.scoresPayload.collectiviteInfo.nom;

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet(this.getExportTitle(mode));

    const colIndex = this.getColumnIndex(mode);

    this.buildWorksheetColumns(worksheet, colIndex);

    const headerRows = await this.buildHeaderRows(
      mode,
      collectiviteName,
      snapshot1,
      snapshot2,
      collectiviteId,
      referentielId
    );

    worksheet.addRows(headerRows);

    // Row indexes
    const rowIndex = {
      // Index of the 2 table header lines
      tableHeader1: headerRows.length - 1,
      tableHeader2: headerRows.length,
      // Index of the first data line
      dataStart: headerRows.length + 1,
    };

    this.styleWorksheet(worksheet, mode, rowIndex, colIndex);

    // Build data common to both snapshots (as they are not historized)
    const commonData = await this.buildCommonData(
      collectiviteId,
      referentielId,
      snapshot1.scoresPayload.scores
    );

    const rows = this.buildAllRows(
      snapshot1.scoresPayload.scores,
      snapshot2?.scoresPayload.scores || null,
      snapshot2 === null,
      commonData
    );

    rows.forEach((row) => worksheet.addRow(row));

    this.styleDataRows(
      worksheet,
      rows,
      rowIndex,
      colIndex,
      mode,
      referentielId
    );

    const fileName = this.buildExportFileName(
      mode,
      snapshot1,
      collectiviteName,
      referentielId,
      exportFormat
    );

    const buffer =
      exportFormat === 'excel'
        ? await workbook.xlsx.writeBuffer()
        : await workbook.csv.writeBuffer();

    return {
      fileName,
      content: buffer as unknown as Buffer,
    };
  }

  private getExportMode(
    isAuditExport?: boolean,
    snapshotReferences?: string[]
  ): ExportMode {
    const isSingleSnapshot = snapshotReferences?.length === 1;
    const isComparison =
      !isAuditExport && (snapshotReferences?.length ?? 0) > 1;

    if (isSingleSnapshot) {
      return ExportMode.SINGLE_SNAPSHOT;
    }
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
  ): Promise<{ snapshot1: Snapshot; snapshot2: Snapshot | null }> {
    const { snapshot1Ref, snapshot2Ref } = await this.getSnapshotReferences(
      mode,
      collectiviteId,
      referentielId,
      snapshotReferences
    );

    let snapshot1: Snapshot | null = null;
    let snapshot2: Snapshot | null = null;

    if (mode === ExportMode.SINGLE_SNAPSHOT) {
      snapshot1 =
        snapshot1Ref === this.SCORE_COURANT
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
        snapshot1Ref === this.SCORE_COURANT
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
        snapshot2Ref === this.SCORE_COURANT
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
      snapshot2Ref = this.SCORE_COURANT;
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

  private getColumnIndex(mode: ExportMode) {
    return mode === ExportMode.SINGLE_SNAPSHOT
      ? this.SINGLE_SNAPSHOT_COL_INDEX
      : this.TWO_SNAPSHOTS_COL_INDEX;
  }

  /**
   * Setup worksheet columns with default width and specific exceptions
   */
  private buildWorksheetColumns(worksheet: any, colIndex: any): void {
    // adds columns with default width and some exceptions
    worksheet.columns = new Array(colIndex.fiches_actions_liees + 1).fill({
      width: 12,
    });
    worksheet.getColumn(colIndex.intitule).width = 50;
    worksheet.getColumn(colIndex.description).width = 50;
    worksheet.getColumn(colIndex.pilotes).width = 50;
    worksheet.getColumn(colIndex.services).width = 50;
    worksheet.getColumn(colIndex.docs).width = 50;
    worksheet.getColumn(colIndex.fiches_actions_liees).width = 50;
  }

  /**
   * Setup header rows for the worksheet
   */
  private async buildHeaderRows(
    mode: ExportMode,
    collectiviteName: string | null,
    snapshot1: Snapshot,
    snapshot2: Snapshot | null,
    collectiviteId: number,
    referentielId: ReferentielId
  ) {
    const { snapshot1Label, snapshot2Label } = this.getScoreHeaderLabels(
      mode,
      snapshot1,
      snapshot2
    );

    return [
      [collectiviteName],
      mode === ExportMode.AUDIT
        ? await this.buildAuditeursRow(snapshot1, collectiviteId, referentielId)
        : null,
      ["Date d'export", new Date()],
      // 2 empty lines
      [],
      [],
      // data table header
      [
        ...Utils.makeEmptyCells(
          (mode === ExportMode.COMPARISON || mode === ExportMode.AUDIT
            ? this.TWO_SNAPSHOTS_COL_INDEX.snapshot1.points_max_personnalises
            : this.SINGLE_SNAPSHOT_COL_INDEX.snapshot
                .points_max_personnalises) - 1
        ),
        snapshot1Label,
        ...Utils.makeEmptyCells(this.SCORE_HEADER_LABELS.length - 1),
        ...(mode === ExportMode.COMPARISON || mode === ExportMode.AUDIT
          ? [snapshot2Label]
          : []),
      ],
      mode === ExportMode.COMPARISON || mode === ExportMode.AUDIT
        ? this.TWO_SNAPSHOTS_COLUMN_LABELS
        : this.SINGLE_SNAPSHOT_COLUMN_LABELS,
    ];
  }

  /**
   * Setup worksheet styles and merge cells
   */
  private styleWorksheet(
    worksheet: any,
    mode: ExportMode,
    rowIndex: any,
    colIndex: any
  ): void {
    // Merge certain cells
    // Collectivity name
    worksheet.mergeCells('A1:B1');
    // First header line for the snapshots
    if (mode === ExportMode.COMPARISON || mode === ExportMode.AUDIT) {
      worksheet.mergeCells(
        rowIndex.tableHeader1,
        this.TWO_SNAPSHOTS_COL_INDEX.snapshot1.points_max_personnalises,
        rowIndex.tableHeader1,
        this.TWO_SNAPSHOTS_COL_INDEX.snapshot1.score_indicatif
      );
      worksheet.mergeCells(
        rowIndex.tableHeader1,
        this.TWO_SNAPSHOTS_COL_INDEX.snapshot2.points_max_personnalises,
        rowIndex.tableHeader1,
        this.TWO_SNAPSHOTS_COL_INDEX.snapshot2.score_indicatif
      );
    } else {
      worksheet.mergeCells(
        rowIndex.tableHeader1,
        this.SINGLE_SNAPSHOT_COL_INDEX.snapshot.points_max_personnalises,
        rowIndex.tableHeader1,
        this.SINGLE_SNAPSHOT_COL_INDEX.snapshot.score_indicatif
      );
    }

    // Add styles to certain columns and cells
    worksheet.getColumn(colIndex.intitule).alignment = Utils.ALIGN_LEFT_WRAP;
    worksheet.getColumn(colIndex.description).alignment = Utils.ALIGN_LEFT_WRAP;
    worksheet.getColumn(colIndex.pilotes).alignment = Utils.ALIGN_LEFT_WRAP;
    worksheet.getColumn(colIndex.services).alignment = Utils.ALIGN_LEFT_WRAP;
    worksheet.getColumn(colIndex.docs).alignment = Utils.ALIGN_LEFT_WRAP;
    worksheet.getColumn(colIndex.fiches_actions_liees).alignment =
      Utils.ALIGN_LEFT_WRAP;
    worksheet.getColumn(colIndex.points_max_referentiel).font = Utils.ITALIC;
    if (colIndex.phase) {
      worksheet.getColumn(colIndex.phase).alignment = Utils.ALIGN_CENTER;
    }
    worksheet.getCell('A1').fill = Utils.FILL.grey;
    worksheet.getCell('B2').fill = Utils.FILL.yellow;
    worksheet.getCell('B3').fill = Utils.FILL.yellow;
    worksheet.getCell('B3').numFmt = 'dd/mm/yyyy';

    if (mode === ExportMode.COMPARISON || mode === ExportMode.AUDIT) {
      worksheet.getCell(
        rowIndex.tableHeader1,
        this.TWO_SNAPSHOTS_COL_INDEX.snapshot1.points_max_personnalises
      ).style = Utils.HEADING1;
      worksheet.getCell(
        rowIndex.tableHeader1,
        this.TWO_SNAPSHOTS_COL_INDEX.snapshot2.points_max_personnalises
      ).style = Utils.HEADING1;
      Utils.setCellsStyle(
        worksheet,
        rowIndex.tableHeader2,
        this.TWO_SNAPSHOTS_COL_INDEX.snapshot1.points_max_personnalises,
        this.TWO_SNAPSHOTS_COL_INDEX.snapshot2.score_indicatif,
        Utils.HEADING_SCORES
      );
      worksheet.getCell(
        rowIndex.tableHeader2,
        this.TWO_SNAPSHOTS_COL_INDEX.snapshot1.points_max_personnalises
      ).border.left = Utils.BORDER_MEDIUM;
      worksheet.getCell(
        rowIndex.tableHeader2,
        this.TWO_SNAPSHOTS_COL_INDEX.snapshot2.score_indicatif
      ).border.right = Utils.BORDER_MEDIUM;

      setColSyles(
        worksheet.getColumn(this.TWO_SNAPSHOTS_COL_INDEX.snapshot1.commentaires)
      );
      setColSyles(
        worksheet.getColumn(this.TWO_SNAPSHOTS_COL_INDEX.snapshot2.commentaires)
      );
      setColSyles(
        worksheet.getColumn(
          this.TWO_SNAPSHOTS_COL_INDEX.snapshot1.score_indicatif
        )
      );
      setColSyles(
        worksheet.getColumn(
          this.TWO_SNAPSHOTS_COL_INDEX.snapshot2.score_indicatif
        )
      );
    } else {
      worksheet.getCell(
        rowIndex.tableHeader1,
        this.SINGLE_SNAPSHOT_COL_INDEX.snapshot.points_max_personnalises
      ).style = Utils.HEADING1;
      Utils.setCellsStyle(
        worksheet,
        rowIndex.tableHeader2,
        this.SINGLE_SNAPSHOT_COL_INDEX.snapshot.points_max_personnalises,
        this.SINGLE_SNAPSHOT_COL_INDEX.snapshot.score_indicatif,
        Utils.HEADING_SCORES
      );
      worksheet.getCell(
        rowIndex.tableHeader2,
        this.SINGLE_SNAPSHOT_COL_INDEX.snapshot.points_max_personnalises
      ).border.left = Utils.BORDER_MEDIUM;
      worksheet.getCell(
        rowIndex.tableHeader2,
        this.SINGLE_SNAPSHOT_COL_INDEX.snapshot.score_indicatif
      ).border.right = Utils.BORDER_MEDIUM;

      setColSyles(
        worksheet.getColumn(
          this.SINGLE_SNAPSHOT_COL_INDEX.snapshot.commentaires
        )
      );
      setColSyles(
        worksheet.getColumn(
          this.SINGLE_SNAPSHOT_COL_INDEX.snapshot.score_indicatif
        )
      );
    }

    Utils.setCellsStyle(
      worksheet,
      rowIndex.tableHeader2,
      colIndex.arbo,
      colIndex.fiches_actions_liees,
      Utils.HEADING2
    );
    worksheet.getCell(
      rowIndex.tableHeader2,
      colIndex.points_max_referentiel
    ).font = { bold: true, italic: true };
  }

  /**
   * Build common data for both snapshots (as they are not historized)
   */
  private async buildCommonData(
    collectiviteId: number,
    referentielId: ReferentielId,
    scores: ActionWithScore
  ): Promise<CommonData> {
    const mesureIds = this.getAllMesureIds(scores);

    return {
      descriptions: await this.getActionDescriptions(referentielId),
      pilotes: await this.handlePilotesService.listPilotes(
        collectiviteId,
        mesureIds
      ),
      services: await this.handleServicesService.listServices(
        collectiviteId,
        mesureIds
      ),
      fichesActionLiees: await this.getFichesActionLiees(
        collectiviteId,
        mesureIds
      ),
    };
  }

  /***
   * Generate data rows by comparing snapshots
   *
   * @param snapshot1Scores - The scores of the first snapshot
   * @param snapshot2Scores - The scores of the second snapshot
   * @param singleSnapshotMode - Whether to export in single snapshot mode
   * @param commonData - The common data for both snapshots
   * @returns The rows of the comparison table
   */
  buildAllRows(
    snapshot1Scores: ActionWithScore,
    snapshot2Scores: ActionWithScore | null,
    singleSnapshotMode: boolean,
    commonData: CommonData
  ): (string | number | null)[][] {
    const rows: (string | number | null)[][] = [];
    this.traverseActionTree(
      snapshot1Scores,
      snapshot2Scores,
      rows,
      0,
      null,
      null,
      singleSnapshotMode,
      commonData
    );

    const ACTION_ID_INDEX = this.SINGLE_SNAPSHOT_COL_INDEX.arbo - 1;
    return (
      rows
        // tri les lignes par actionId (pour éviter d'avoir 1, 10, 2)
        .toSorted((a, b) => {
          const idA = a[ACTION_ID_INDEX]?.toString() || '';
          const idB = b[ACTION_ID_INDEX]?.toString() || '';
          if (idA === this.TOTAL_LABEL) return -1;
          if (idB === this.TOTAL_LABEL) return 1;
          return idA.localeCompare(idB, undefined, {
            numeric: true,
            sensitivity: 'base',
          });
        })
    );
  }

  private traverseActionTree(
    snapshot1Action: ActionWithScore | null,
    snapshot2Action: ActionWithScore | null,
    rows: (string | number | null)[][],
    depth = 0,
    parentSnapshot1Action: ActionWithScore | null = null,
    parentSnapshot2Action: ActionWithScore | null = null,
    isSingleSnapshotMode: boolean,
    commonData: CommonData
  ): void {
    rows.push(
      this.buildRow(
        snapshot1Action,
        snapshot2Action,
        parentSnapshot1Action,
        parentSnapshot2Action,
        isSingleSnapshotMode,
        commonData
      )
    );

    const snapshot1Children = snapshot1Action?.actionsEnfant || [];
    const snapshot2Children = snapshot2Action?.actionsEnfant || [];

    snapshot1Children.forEach((snapshot1Child) => {
      const snapshot2Child = snapshot2Children.find(
        (child) => child.actionId === snapshot1Child.actionId
      );

      this.traverseActionTree(
        snapshot1Child,
        snapshot2Child || null,
        rows,
        depth + 1,
        snapshot1Action,
        snapshot2Action,
        isSingleSnapshotMode,
        commonData
      );
    });

    if (!isSingleSnapshotMode && snapshot2Children.length > 0) {
      snapshot2Children.forEach((snapshot2Child) => {
        const existsInSnapshot1 = snapshot1Children.some(
          (child) => child.actionId === snapshot2Child.actionId
        );

        if (!existsInSnapshot1) {
          this.traverseActionTree(
            null,
            snapshot2Child,
            rows,
            depth + 1,
            null,
            snapshot2Action,
            isSingleSnapshotMode,
            commonData
          );
        }
      });
    }
  }

  private buildRow(
    snapshot1Action: ActionWithScore | null,
    snapshot2Action: ActionWithScore | null,
    parentSnapshot1Action: ActionWithScore | null = null,
    parentSnapshot2Action: ActionWithScore | null = null,
    singleSnapshotMode = false,
    commonData: CommonData
  ): (string | number | null)[] {
    // As an exception, naming variable in french to match snapshot structure
    const identifiant =
      snapshot1Action?.identifiant || snapshot2Action?.identifiant || '';

    const actionId =
      snapshot1Action?.actionId || snapshot2Action?.actionId || '';

    const actionName = snapshot1Action?.nom || snapshot2Action?.nom || '';

    const phase =
      snapshot1Action?.categorie || snapshot2Action?.categorie || '';

    // Points max referentiel
    const pointReferentiel =
      snapshot1Action?.score?.pointReferentiel ||
      snapshot2Action?.score?.pointReferentiel ||
      null;

    // Check if this is the total row (referentiel root action)
    const isTotalRow =
      snapshot1Action?.actionType === ActionTypeEnum.REFERENTIEL ||
      snapshot2Action?.actionType === ActionTypeEnum.REFERENTIEL;

    // Points potentiels
    const snapshot1PointPotentiel =
      snapshot1Action?.score?.pointPotentiel || null;

    // Points faits
    const snapshot1PointFait = snapshot1Action?.score?.pointFait || null;

    // Pourcentage fait
    const snapshot1ScoreRealise =
      snapshot1PointFait && snapshot1PointPotentiel
        ? roundTo(snapshot1PointFait / snapshot1PointPotentiel, 3)
        : null;

    // Points programmés
    const snapshot1PointProgramme =
      snapshot1Action?.score?.pointProgramme || null;

    // Pourcentage programmé
    const snapshot1ScoreProgramme =
      snapshot1PointProgramme && snapshot1PointPotentiel
        ? roundTo(snapshot1PointProgramme / snapshot1PointPotentiel, 3)
        : null;

    // Points pas faits
    const snapshot1PointPasFait = snapshot1Action?.score?.pointPasFait || null;

    // Pourcentage pas fait
    const snapshot1ScorePasFait =
      snapshot1PointPasFait && snapshot1PointPotentiel
        ? roundTo(snapshot1PointPasFait / snapshot1PointPotentiel, 3)
        : null;

    // Statut
    const snapshot1Statut = snapshot1Action
      ? this.formatActionStatut(
          snapshot1Action,
          parentSnapshot1Action ? parentSnapshot1Action : undefined
        )
      : '';

    const snapshot2PointPotentiel =
      snapshot2Action?.score?.pointPotentiel || null;

    // Points faits
    const snapshot2PointFait = snapshot2Action?.score?.pointFait || null;

    // Pourcentage fait
    const snapshot2ScoreRealise =
      snapshot2PointFait && snapshot2PointPotentiel
        ? roundTo(snapshot2PointFait / snapshot2PointPotentiel, 3)
        : null;

    // Points programmés
    const snapshot2PointsProgrammes =
      snapshot2Action?.score?.pointProgramme || null;

    // Pourcentage programmé
    const snapshot2ScoreProgramme =
      snapshot2PointsProgrammes && snapshot2PointPotentiel
        ? roundTo(snapshot2PointsProgrammes / snapshot2PointPotentiel, 3)
        : null;

    // Points pas faits
    const snapshot2PointPasFait = snapshot2Action?.score?.pointPasFait || null;

    // Pourcentage pas fait
    const snapshot2ScorePasFait =
      snapshot2PointPasFait && snapshot2PointPotentiel
        ? roundTo(snapshot2PointPasFait / snapshot2PointPotentiel, 3)
        : null;

    // Statut
    const snapshot2Statut = snapshot2Action
      ? this.formatActionStatut(
          snapshot2Action,
          parentSnapshot2Action ? parentSnapshot2Action : undefined
        )
      : '';

    // Commentaires
    const snapshot1Commentaires = htmlToText(
      snapshot1Action?.score?.explication || ''
    );
    const snapshot2Commentaires = htmlToText(
      snapshot2Action?.score?.explication || ''
    );

    // scores indicatifs
    const snapshot1ScoreIndicatif = snapshot1Action?.scoreIndicatif
      ? getLibelleScoreIndicatif(snapshot1Action.scoreIndicatif)
      : '';
    const snapshot2ScoreIndicatif = snapshot2Action?.scoreIndicatif
      ? getLibelleScoreIndicatif(snapshot2Action.scoreIndicatif)
      : '';

    // docs
    const docs =
      this.formatPreuves(
        snapshot1Action?.preuves || snapshot2Action?.preuves
      ) || '';

    const baseRow = [
      // arbo (identifiant) - use TOTAL_LABEL for total row
      isTotalRow ? this.TOTAL_LABEL : identifiant,
      // intitule (nom) - empty for total row
      isTotalRow ? '' : actionName,
      // description
      isTotalRow ? '' : commonData.descriptions[actionId] || '',
      // phase (categorie)
      Utils.capitalize(phase),
      // points_max_referentiel
      pointReferentiel,
      // potentiel collectivité
      snapshot1PointPotentiel,
      // points réalisés
      snapshot1PointFait,
      // pourcentage réalisé
      snapshot1ScoreRealise,
      // points programmés
      snapshot1PointProgramme,
      // pourcentage programmé
      snapshot1ScoreProgramme,
      // points pas faits
      snapshot1PointPasFait,
      // pourcentage pas fait
      snapshot1ScorePasFait,
      // statut
      snapshot1Statut,
      // commentaires
      snapshot1Commentaires,
      // score indicatif
      snapshot1ScoreIndicatif,
    ];

    if (singleSnapshotMode) {
      return [
        ...baseRow,
        // pilotes
        isTotalRow
          ? ''
          : commonData.pilotes[actionId]?.map((p) => p.nom).join(', ') || '',
        // services
        isTotalRow
          ? ''
          : commonData.services[actionId]?.map((s) => s.nom).join(', ') || '',
        // docs
        docs,
        // fiches actions liées
        isTotalRow ? '' : commonData.fichesActionLiees[actionId] || '',
      ];
    }

    return [
      ...baseRow,
      // potentiel collectivité
      snapshot2PointPotentiel,
      // points réalisés
      snapshot2PointFait,
      // pourcentage réalisé
      snapshot2ScoreRealise,
      // points programmés
      snapshot2PointsProgrammes,
      // pourcentage programmé
      snapshot2ScoreProgramme,
      // points pas faits
      snapshot2PointPasFait,
      // pourcentage pas fait
      snapshot2ScorePasFait,
      // statut
      snapshot2Statut,
      // commentaires
      snapshot2Commentaires,
      // score indicatif
      snapshot2ScoreIndicatif,
      // pilotes
      isTotalRow
        ? ''
        : commonData.pilotes[actionId]?.map((p) => p.nom).join(', ') || '',
      // services
      isTotalRow
        ? ''
        : commonData.services[actionId]?.map((s) => s.nom).join(', ') || '',
      // docs
      docs,
      // fiches actions liées
      isTotalRow ? '' : commonData.fichesActionLiees[actionId] || '',
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

  private getExportTitle(mode: ExportMode): string {
    if (mode === ExportMode.AUDIT) {
      return this.EXPORT_TITLES.audit;
    }
    if (mode === ExportMode.SINGLE_SNAPSHOT) {
      return this.EXPORT_TITLES.singleSnapshot;
    }
    return this.EXPORT_TITLES.comparison;
  }

  private buildExportFileName(
    mode: ExportMode,
    snapshot1: Snapshot,
    collectiviteName: string | null,
    referentielId: ReferentielId,
    exportFormat: ExportFormat
  ): string {
    const extension = exportFormat === 'excel' ? '.xlsx' : '.csv';

    const exportedAt = format(new Date(), 'yyyy-MM-dd');

    if (mode === ExportMode.AUDIT) {
      return unaccent(
        `Export_audit_${collectiviteName}_${exportedAt}${extension}`
      );
    }
    if (mode === ExportMode.SINGLE_SNAPSHOT) {
      if (snapshot1.ref === this.SCORE_COURANT) {
        return unaccent(
          `Export_${referentielId?.toUpperCase()}_${collectiviteName}_${exportedAt}${extension}`
        );
      }
      // Single snapshot, but not the current score
      return unaccent(`Export_${snapshot1.nom}_${exportedAt}${extension}`);
    }
    return unaccent(
      `Export_comparaison_${referentielId?.toUpperCase()}_${collectiviteName}_${exportedAt}${extension}`
    );
  }

  private getScoreHeaderLabels(
    mode: ExportMode,
    snapshot1: Snapshot,
    snapshot2: Snapshot | null
  ): { snapshot1Label: string; snapshot2Label: string } {
    let snapshot1Label: string = snapshot1.nom;

    if (mode === ExportMode.AUDIT) {
      snapshot1Label = 'Proposé avant audit dans la plateforme';
    }

    if (
      mode === ExportMode.SINGLE_SNAPSHOT &&
      snapshot1.ref === this.SCORE_COURANT
    ) {
      snapshot1Label = 'Évaluation dans la plateforme';
    }

    if (
      mode === ExportMode.COMPARISON &&
      snapshot1.ref === this.SCORE_COURANT
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
      snapshot2?.ref === this.SCORE_COURANT
    ) {
      snapshot2Label = 'État des lieux actuel';
    }

    return { snapshot1Label, snapshot2Label };
  }

  /**
   * Find the snapshot-ref associated to the current opened audit
   */
  private async getOpenedPreAuditSnapshotRef(
    collectiviteId: number,
    referentielId: ReferentielId
  ): Promise<string> {
    const [openedPreAuditSnapshot] = await this.db.db
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

  private async buildAuditeursRow(
    snapshot: Snapshot,
    collectiviteId: number,
    referentielId: ReferentielId
  ): Promise<string[]> {
    let auditeurs: { prenom: string | null; nom: string | null }[] = [];

    if (snapshot.auditId) {
      auditeurs = await this.db.db
        .select({
          prenom: dcpTable.prenom,
          nom: dcpTable.nom,
        })
        .from(auditeurTable)
        .leftJoin(dcpTable, eq(dcpTable.userId, auditeurTable.auditeur))
        .where(eq(auditeurTable.auditId, snapshot.auditId));

      if (!auditeurs.length) {
        this.logger.warn(
          `No auditeurs found for collectivite ${collectiviteId}, referentiel ${referentielId}, audit ${snapshot.auditId}`
        );
      }
    } else {
      this.logger.warn(
        `No auditId found in snapshot for collectivite ${collectiviteId}, referentiel ${referentielId}`
      );
    }

    return [
      'Audit',
      auditeurs?.map(({ prenom, nom }) => `${prenom} ${nom}`).join(' / '),
    ];
  }

  /**
   * Apply styles to data rows
   */
  private styleDataRows(
    worksheet: any,
    rows: (string | number | null)[][],
    rowIndex: any,
    colIndex: any,
    mode: ExportMode,
    referentielId: ReferentielId
  ): void {
    rows.forEach((_, index) => {
      const r = rowIndex.dataStart + index;
      const row = worksheet.getRow(r);

      const actionId = row.getCell(colIndex.arbo).value as string;

      if (actionId === this.TOTAL_LABEL) {
        // "total" row
        Utils.setCellsStyle(
          worksheet,
          r,
          colIndex.arbo,
          colIndex.fiches_actions_liees,
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
      Utils.setCellNumFormat(row.getCell(colIndex.points_max_referentiel));
      if (mode === ExportMode.COMPARISON || mode === ExportMode.AUDIT) {
        setScoreFormats(
          row,
          this.TWO_SNAPSHOTS_COL_INDEX.snapshot1.points_max_personnalises
        );
        setScoreFormats(
          row,
          this.TWO_SNAPSHOTS_COL_INDEX.snapshot2.points_max_personnalises
        );
      } else {
        setScoreFormats(
          row,
          this.SINGLE_SNAPSHOT_COL_INDEX.snapshot.points_max_personnalises
        );
      }
    });
  }
}

// fixe les styles d'une colonne
function setColSyles(
  col: Column,
  styles: { alignment?: Partial<Alignment>; width?: number } = {
    alignment: Utils.ALIGN_LEFT_WRAP,
    width: 50,
  }
) {
  col.alignment = styles.alignment;
  col.width = styles.width;
}
