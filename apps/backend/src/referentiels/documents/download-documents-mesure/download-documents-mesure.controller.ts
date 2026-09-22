import { Controller, Get, Logger, Param, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { TokenInfo } from '@tet/backend/users/decorators/token-info.decorators';
import type { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import { createControllerErrorHandler } from '@tet/backend/utils/nest/controller-error-handler';
import type { Response } from 'express';
import { ARCHIVE_ZIP_CONTENT_TYPE } from '@tet/backend/utils/archive/archive-assembly.service';
import { createZodDto } from 'nestjs-zod';

import { downloadDocumentsMesureErrorConfig } from './download-documents-mesure.errors';
import { downloadDocumentsMesureInputSchema } from './download-documents-mesure.input';
import { DownloadDocumentsMesureService } from './download-documents-mesure.service';

class DownloadDocumentsMesureParamsClass extends createZodDto(
  downloadDocumentsMesureInputSchema
) {}

const toExtValue = (filename: string): string =>
  encodeURIComponent(filename).replace(
    /['()*!]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );

@ApiExcludeController()
@Controller('collectivites/:collectiviteId/mesures/:actionId/documents')
export class DownloadDocumentsMesureController {
  private readonly logger = new Logger(DownloadDocumentsMesureController.name);

  constructor(
    private readonly downloadDocumentsMesureService: DownloadDocumentsMesureService
  ) {}

  private readonly getResultDataOrThrowError = createControllerErrorHandler(
    downloadDocumentsMesureErrorConfig
  );

  @Get('archive')
  @ApiUsage([ApiUsageEnum.APP])
  async downloadArchive(
    @Param() params: DownloadDocumentsMesureParamsClass,
    @TokenInfo() user: AuthenticatedUser,
    @Res() response: Response
  ): Promise<void> {
    const prepareResult =
      await this.downloadDocumentsMesureService.prepareArchive(params, {
        user,
      });
    const { filename, writeTo } = this.getResultDataOrThrowError(prepareResult);

    response.set('Content-Type', ARCHIVE_ZIP_CONTENT_TYPE);
    response.set(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${toExtValue(filename)}`
    );
    response.set('Access-Control-Expose-Headers', 'Content-Disposition');

    const writeResult = await writeTo(response);
    if (!writeResult.success) {
      this.logger.error(
        `Archive of the documents of mesure ${params.actionId} interrupted after the headers were sent`
      );
    }
  }
}
