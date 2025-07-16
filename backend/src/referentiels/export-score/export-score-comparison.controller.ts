import { COLLECTIVITE_ID_PARAM_KEY } from '@/backend/collectivites/shared/models/collectivite-api.constants';
import { ApiUsageEnum } from '@/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@/backend/utils/api/api-usage.decorator';
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
import { ReferentielId } from '../index-domain';
import { REFERENTIEL_ID_PARAM_KEY } from '../models/referentiel-api.constants';
import { ExportScoreComparisonService } from './export-score-comparison.service';

@ApiTags('Referentiels')
@ApiExcludeController()
@Controller('')
export class ExportScoreComparisonController {
  private readonly logger = new Logger(ExportScoreComparisonController.name);

  constructor(
    private readonly exportScoreComparisonService: ExportScoreComparisonService
  ) {}

  // @AllowAnonymousAccess()
  @Get(
    `collectivites/:${COLLECTIVITE_ID_PARAM_KEY}/referentiels/:${REFERENTIEL_ID_PARAM_KEY}/score-snapshots/export-comparison`
  )
  @ApiUsage([ApiUsageEnum.APP])
  async exportAuditScore(
    @Param(COLLECTIVITE_ID_PARAM_KEY) collectiviteId: number,
    @Param(REFERENTIEL_ID_PARAM_KEY) referentielId: ReferentielId,
    @Query('isAudit') isAudit: string,
    @Query('snapshotReferences') snapshotReferencesQuery: string,
    @Res() res: Response,
    @Next() next: NextFunction
  ) {
    this.logger.log(
      `Export de comparaison des scores du referentiel ${referentielId} pour la collectivite ${collectiviteId}`
    );

    // Parse les paramètres
    const isAuditBoolean = isAudit === 'true';
    const snapshotReferences = snapshotReferencesQuery
      ? snapshotReferencesQuery.split(',')
      : [];

    console.log('isAudit', isAuditBoolean);
    console.log('snapshotReferences', snapshotReferences);

    try {
      const { fileName, content } =
        await this.exportScoreComparisonService.exportComparisonScore(
          collectiviteId,
          referentielId,
          isAuditBoolean,
          snapshotReferences
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
