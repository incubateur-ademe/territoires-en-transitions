import { COLLECTIVITE_ID_PARAM_KEY } from '@/backend/collectivites/shared/models/collectivite-api.constants';
import { AllowAnonymousAccess } from '@/backend/users/decorators/allow-anonymous-access.decorator';
import { TokenInfo } from '@/backend/users/decorators/token-info.decorators';
import { AuthUser } from '@/backend/users/index-domain';
import { ApiUsageEnum } from '@/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@/backend/utils/api/api-usage.decorator';
import { Controller, Get, Logger, Next, Param, Res } from '@nestjs/common';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';
import { NextFunction, Response } from 'express';
import { ReferentielId } from '../index-domain';
import { REFERENTIEL_ID_PARAM_KEY } from '../models/referentiel-api.constants';
import { ExportScoreComparaisonService } from './export-score-comparaison.service';

@ApiTags('Referentiels')
@ApiExcludeController()
@Controller('')
export class ExportScoreComparaisonController {
  private readonly logger = new Logger(ExportScoreComparaisonController.name);

  constructor(
    private readonly exportScoreComparaisonService: ExportScoreComparaisonService
  ) {}

  @AllowAnonymousAccess()
  @Get(
    `collectivites/:${COLLECTIVITE_ID_PARAM_KEY}/referentiels/:${REFERENTIEL_ID_PARAM_KEY}/score-snapshots/export-comparaison/audit`
  )
  @ApiUsage([ApiUsageEnum.APP])
  async exportAuditScore(
    @Param(COLLECTIVITE_ID_PARAM_KEY) collectiviteId: number,
    @Param(REFERENTIEL_ID_PARAM_KEY) referentielId: ReferentielId,
    @TokenInfo() user: AuthUser,
    @Res() res: Response,
    @Next() next: NextFunction
  ) {
    this.logger.log(
      `Export de comparaison des scores d'audit du referentiel ${referentielId} pour la collectivite ${collectiviteId}`
    );

    try {
      const { fileName, content } =
        await this.exportScoreComparaisonService.exportAuditScore(
          collectiviteId,
          referentielId
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
