import { COLLECTIVITE_ID_PARAM_KEY } from '@/backend/collectivites/shared/models/collectivite-api.constants';
import { exportScoreComparisonRequestSchema } from '@/backend/referentiels/export-score/export-score-comparison.request';
import { ReferentielId } from '@/backend/referentiels/models/referentiel-id.enum';
import { AllowAnonymousAccess } from '@/backend/users/decorators/allow-anonymous-access.decorator';
import { ApiUsageEnum } from '@/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@/backend/utils/api/api-usage.decorator';
import { createZodDto } from '@anatine/zod-nestjs';
import {
  Controller,
  Get,
  Logger,
  Next,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';
import { NextFunction, Response } from 'express';
import { REFERENTIEL_ID_PARAM_KEY } from '../models/referentiel-api.constants';
import { ExportScoreComparisonService } from './export-score-comparison.service';

export class ExportScoreComparisonApiQueryClass extends createZodDto(
  exportScoreComparisonRequestSchema
) {}

@ApiTags('Referentiels')
@ApiExcludeController()
@Controller('')
export class ExportScoreComparisonController {
  private readonly logger = new Logger(ExportScoreComparisonController.name);

  constructor(
    private readonly exportScoreComparisonService: ExportScoreComparisonService
  ) {}

  @AllowAnonymousAccess()
  @Get(
    `collectivites/:${COLLECTIVITE_ID_PARAM_KEY}/referentiels/:${REFERENTIEL_ID_PARAM_KEY}/score-snapshots/export-comparison`
  )
  @ApiUsage([ApiUsageEnum.APP])
  async exportAuditScore(
    @Param(COLLECTIVITE_ID_PARAM_KEY) collectiviteId: number,
    @Param(REFERENTIEL_ID_PARAM_KEY) referentielId: ReferentielId,
    @Query() query: ExportScoreComparisonApiQueryClass,
    @Res() res: Response,
    @Next() next: NextFunction
  ) {
    this.logger.log(
      `Export de comparaison des scores du referentiel ${referentielId} pour la collectivite ${collectiviteId}`
    );

    try {
      const { fileName, content } =
        await this.exportScoreComparisonService.exportComparisonScore(
          collectiviteId,
          referentielId,
          query
        );

      res.attachment(fileName);
      res.set('Access-Control-Expose-Headers', 'Content-Disposition');

      // Send the buffer directly since it's already a Buffer
      res.send(content);
    } catch (error) {
      next(error);
    }
  }
}
