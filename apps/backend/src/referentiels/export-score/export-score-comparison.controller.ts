import {
  Controller,
  Get,
  Logger,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';
import { COLLECTIVITE_ID_PARAM_KEY } from '@tet/backend/collectivites/shared/models/collectivite-api.constants';
import { AllowAnonymousAccess } from '@tet/backend/users/decorators/allow-anonymous-access.decorator';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import { createControllerErrorHandler } from '@tet/backend/utils/nest/controller-error-handler';
import {
  exportScoreComparisonRequestSchema,
  type ReferentielId,
} from '@tet/domain/referentiels';
import type { Response } from 'express';
import { createZodDto } from 'nestjs-zod';
import { REFERENTIEL_ID_PARAM_KEY } from '../models/referentiel-api.constants';
import { exportScoreComparisonErrorConfig } from './export-score-comparison.errors';
import { ExportScoreComparisonService } from './export-score-comparison.service';

export class ExportScoreComparisonApiQueryClass extends createZodDto(
  exportScoreComparisonRequestSchema
) {}

@ApiTags('Referentiels')
@ApiExcludeController()
@Controller('')
export class ExportScoreComparisonController {
  private readonly logger = new Logger(ExportScoreComparisonController.name);
  private readonly getResultDataOrThrowError = createControllerErrorHandler(
    exportScoreComparisonErrorConfig
  );

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
    @Res() res: Response
  ) {
    this.logger.log(
      `Export de comparaison des scores du referentiel ${referentielId} pour la collectivite ${collectiviteId}`
    );

    const { fileName, content } = this.getResultDataOrThrowError(
      await this.exportScoreComparisonService.exportComparisonScore(
        collectiviteId,
        referentielId,
        query
      )
    );

    res.attachment(fileName);
    res.set('Access-Control-Expose-Headers', 'Content-Disposition');
    res.send(content);
  }
}
