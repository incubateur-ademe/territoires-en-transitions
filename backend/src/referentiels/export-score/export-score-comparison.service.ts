import { Injectable, Logger } from '@nestjs/common';
import { ReferentielId } from '../models/referentiel-id.enum';
import { ExportScoreComparisonBaseService } from './export-score-comparison-base.service';
import { ExportScoreComparisonScoreIndicatifService } from './export-score-comparison-score-indicatif.service';
import { ExportScoreComparisonRequestQuery } from './export-score-comparison.request';

@Injectable()
export class ExportScoreComparisonService {
  private readonly logger = new Logger(ExportScoreComparisonService.name);

  constructor(
    private readonly exportBaseService: ExportScoreComparisonBaseService,
    private readonly exportAvecScoreIndicatifService: ExportScoreComparisonScoreIndicatifService
  ) {}

  async exportComparisonScore(
    collectiviteId: number,
    referentielId: ReferentielId,
    query: ExportScoreComparisonRequestQuery
  ): Promise<{ fileName: string; content: Buffer }> {
    return query.isScoreIndicatifEnabled
      ? this.exportAvecScoreIndicatifService.exportComparisonScore(
          collectiviteId,
          referentielId,
          query
        )
      : this.exportBaseService.exportComparisonScore(
          collectiviteId,
          referentielId,
          query
        );
  }
}
