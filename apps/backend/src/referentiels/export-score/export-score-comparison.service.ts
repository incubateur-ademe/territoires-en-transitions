import { Injectable, Logger } from '@nestjs/common';
import { sanitizeWorksheetForCsvExport } from '@tet/backend/utils/excel/export-excel.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import {
  ExportScoreComparisonRequestQuery,
  ReferentielId,
} from '@tet/domain/referentiels';
import { Workbook } from 'exceljs';
import { buildRows } from './build-rows';
import {
  ExportScoreComparisonError,
  ExportScoreComparisonErrorEnum,
} from './export-score-comparison.errors';
import { LoadScoreComparisonService } from './load-score-comparison.service';

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
  ): Promise<
    Result<{ fileName: string; content: Buffer }, ExportScoreComparisonError>
  > {
    const { exportFormat } = query;

    this.logger.log(
      `Export des scores pour la collectivité ${collectiviteId}, referentiel ${referentielId}, format ${exportFormat}`
    );

    const scoreComparisonResult =
      await this.loadScoreComparisonService.loadScoreComparison(
        collectiviteId,
        referentielId,
        query
      );
    if (!scoreComparisonResult.success) {
      return scoreComparisonResult;
    }
    const scoreComparisonData = scoreComparisonResult.data;
    const { exportFileName, exportTitle } = scoreComparisonData;

    try {
      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet(exportTitle);
      buildRows(scoreComparisonData, worksheet);

      if (exportFormat === 'csv') {
        sanitizeWorksheetForCsvExport(worksheet);
      }

      const buffer =
        exportFormat === 'excel'
          ? await workbook.xlsx.writeBuffer()
          : await workbook.csv.writeBuffer();

      this.logger.log(
        `Fin export des scores pour la collectivité ${collectiviteId}, referentiel ${referentielId}, format ${exportFormat}: fichier ${exportFileName} taille ${buffer.byteLength} octets`
      );

      return success({
        fileName: exportFileName,
        content: Buffer.from(buffer),
      });
    } catch (error) {
      this.logger.error(error);
      return failure(
        ExportScoreComparisonErrorEnum.EXPORT_SNAPSHOT_COMPUTE_FAILED,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
