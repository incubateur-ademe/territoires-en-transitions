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
import {
  REFERENTIEL_ID_PARAM_KEY,
  SNAPSHOT_REF_PARAM_KEY,
} from '../models/referentiel-api.constants';
import { ExportScoreService } from './export-score.service';

@ApiTags('Referentiels')
@ApiExcludeController()
@Controller('')
export class ExportScoreController {
  private readonly logger = new Logger(ExportScoreController.name);

  constructor(private readonly exportScoreService: ExportScoreService) {}

  @AllowAnonymousAccess()
  @Get(
    `collectivites/:${COLLECTIVITE_ID_PARAM_KEY}/referentiels/:${REFERENTIEL_ID_PARAM_KEY}/score-snapshots/export/:${SNAPSHOT_REF_PARAM_KEY}`
  )
  @ApiUsage([ApiUsageEnum.APP])
  async exportReferentielScoreSnapshot(
    @Param(COLLECTIVITE_ID_PARAM_KEY) collectiviteId: number,
    @Param(REFERENTIEL_ID_PARAM_KEY) referentielId: ReferentielId,
    @Param(SNAPSHOT_REF_PARAM_KEY) snapshotRef: string,
    @TokenInfo() user: AuthUser,
    @Res() res: Response,
    @Next() next: NextFunction
  ) {
    this.logger.log(
      `Export du score du referentiel ${referentielId} pour la collectivite ${collectiviteId} et le snapshot ${snapshotRef}`
    );

    try {
      const { fileName, content } =
        await this.exportScoreService.exportCurrentSnapshotScore(
          collectiviteId,
          referentielId,
          snapshotRef
        );

      res.attachment(fileName);
      res.set('Access-Control-Expose-Headers', 'Content-Disposition');

      // Send the workbook.
      res.send(await content.writeBuffer());
    } catch (error) {
      next(error);
    }
  }
}
