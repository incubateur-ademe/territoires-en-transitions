import { Injectable, Logger } from '@nestjs/common';
import { ExportScoreComparisonRequestQuery } from '@tet/backend/referentiels/export-score/export-score-comparison.request';
import { ReferentielId } from '@tet/domain/referentiels';
import { Workbook } from 'exceljs';
import { buildRows } from './build-rows';
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
