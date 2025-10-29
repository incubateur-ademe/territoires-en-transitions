import { ScoreFinalFields } from '@/backend/referentiels/compute-score/score.dto';
import { ExportScoreComparisonRequestQuery } from '@/backend/referentiels/export-score/export-score-comparison.request';
import { ActionDefinition } from '@/backend/referentiels/models/action-definition.table';
import { Injectable, Logger } from '@nestjs/common';
import { Workbook } from 'exceljs';
import {
  ActionDefinitionEssential,
  TreeNode,
} from '../models/action-definition.dto';
import { ReferentielId } from '../models/referentiel-id.enum';
import { buildRows } from './build-rows';
import { LoadScoreComparisonService } from './load-score-comparison.service';

export type ActionWithScore = TreeNode<
  Pick<ActionDefinition, 'nom' | 'identifiant' | 'categorie'> &
    ActionDefinitionEssential &
    ScoreFinalFields
>;

@Injectable()
export class ExportScoreComparisonService {
  private readonly logger = new Logger(ExportScoreComparisonService.name);

  constructor(
    private readonly loadScoreComparisonService: LoadScoreComparisonService
  ) {}

  async exportComparisonScore(
    collectiviteId: number,
    referentielId: ReferentielId,
    query: ExportScoreComparisonRequestQuery
  ) {
    const { exportFormat } = query;

    this.logger.log(
      `Export des scores pour la collectivité ${collectiviteId}, referentiel ${referentielId}, format ${exportFormat}`
    );

    const scoreComparisonData =
      await this.loadScoreComparisonService.loadScoreComparison(
        collectiviteId,
        referentielId,
        query
      );
    const { exportFileName, exportTitle } = scoreComparisonData;

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet(exportTitle);
    buildRows(scoreComparisonData, worksheet);

    const buffer =
      exportFormat === 'excel'
        ? await workbook.xlsx.writeBuffer()
        : await workbook.csv.writeBuffer();

    this.logger.log(
      `Fin export des scores pour la collectivité ${collectiviteId}, referentiel ${referentielId}, format ${exportFormat}: fichier ${exportFileName} taille ${buffer.byteLength} octets`
    );

    return { fileName: exportFileName, content: buffer };
  }
}
