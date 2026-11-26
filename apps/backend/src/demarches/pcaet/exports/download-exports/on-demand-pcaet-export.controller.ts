import {
  Controller,
  Get,
  Query,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { TokenInfo } from '@tet/backend/users/decorators/token-info.decorators';
import {
  isAuthenticatedUser,
  type AuthUser,
} from '@tet/backend/users/models/auth.models';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import { buildAttachmentContentDisposition } from '@tet/backend/utils/archive/build-content-disposition.utils';
import { createControllerErrorHandler } from '@tet/backend/utils/nest/controller-error-handler';
import type { Response } from 'express';
import { createZodDto } from 'nestjs-zod';
import { demarchePcaetExportsErrorConfig } from './demarche-pcaet-exports.errors';
import {
  onDemandPcaetExportQuerySchema,
  toDemarchePcaetExportRef,
} from './demarche-pcaet-exports.input';
import { BuildOnDemandPcaetExportService } from './build-on-demand-pcaet-export.service';

class OnDemandPcaetExportQueryClass extends createZodDto(
  onDemandPcaetExportQuerySchema
) {}

const XLSX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * L'export du jour d'un dépôt PCAET sans export figé. En REST et non en tRPC :
 * la réponse est un fichier.
 */
@ApiExcludeController()
@Controller('demarches/pcaet/exports')
export class OnDemandPcaetExportController {
  constructor(private readonly buildService: BuildOnDemandPcaetExportService) {}

  private readonly getResultDataOrThrowError = createControllerErrorHandler(
    demarchePcaetExportsErrorConfig
  );

  @Get('on-demand')
  @ApiUsage([ApiUsageEnum.APP])
  async send(
    @Query() query: OnDemandPcaetExportQueryClass,
    @TokenInfo() user: AuthUser,
    @Res() response: Response
  ): Promise<void> {
    // Le guard laisse passer un jeton service_role, qui contournerait les
    // contrôles de permission : un utilisateur identifié est requis, comme
    // pour `authedProcedure`.
    if (!isAuthenticatedUser(user)) {
      throw new UnauthorizedException();
    }
    const result = await this.buildService.build(
      { ref: toDemarchePcaetExportRef(query), type: query.type },
      { user }
    );
    const { buffer, filename } = this.getResultDataOrThrowError(result);

    response.set('Content-Type', XLSX_CONTENT_TYPE);
    response.set(
      'Content-Disposition',
      buildAttachmentContentDisposition(filename)
    );
    response.set('Access-Control-Expose-Headers', 'Content-Disposition');
    response.send(buffer);
  }
}
