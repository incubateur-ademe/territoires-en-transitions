import { Controller, Get, Logger, Query, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { TokenInfo } from '@tet/backend/users/decorators/token-info.decorators';
import type { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import { ARCHIVE_ZIP_CONTENT_TYPE } from '@tet/backend/utils/archive/archive-assembly.service';
import { buildAttachmentContentDisposition } from '@tet/backend/utils/archive/build-content-disposition.utils';
import { createControllerErrorHandler } from '@tet/backend/utils/nest/controller-error-handler';
import type { Response } from 'express';
import { createZodDto } from 'nestjs-zod';
import { downloadAvisPiecesErrorConfig } from './download-avis-pieces.errors';
import { downloadAvisPiecesQuerySchema } from './download-avis-pieces.input';
import { DownloadAvisPiecesService } from './download-avis-pieces.service';

class DownloadAvisPiecesQueryClass extends createZodDto(
  downloadAvisPiecesQuerySchema
) {}

/**
 * L'archive des pièces d'un avis. En REST et non en tRPC : la réponse est un
 * zip écrit en flux.
 */
@ApiExcludeController()
@Controller('demarches/pcaet/avis/pieces')
export class DownloadAvisPiecesController {
  private readonly logger = new Logger(DownloadAvisPiecesController.name);

  constructor(
    private readonly downloadAvisPiecesService: DownloadAvisPiecesService
  ) {}

  private readonly getResultDataOrThrowError = createControllerErrorHandler(
    downloadAvisPiecesErrorConfig
  );

  @Get('archive')
  @ApiUsage([ApiUsageEnum.APP])
  async downloadArchive(
    @Query() query: DownloadAvisPiecesQueryClass,
    @TokenInfo() user: AuthenticatedUser,
    @Res() response: Response
  ): Promise<void> {
    const prepareResult = await this.downloadAvisPiecesService.prepareArchive(
      query,
      { user }
    );
    const { filename, writeTo } = this.getResultDataOrThrowError(prepareResult);

    response.set('Content-Type', ARCHIVE_ZIP_CONTENT_TYPE);
    response.set(
      'Content-Disposition',
      buildAttachmentContentDisposition(filename)
    );
    response.set('Access-Control-Expose-Headers', 'Content-Disposition');

    const writeResult = await writeTo(response);
    if (!writeResult.success) {
      this.logger.error(
        'Archive of the avis pieces interrupted after the headers were sent'
      );
    }
  }
}
