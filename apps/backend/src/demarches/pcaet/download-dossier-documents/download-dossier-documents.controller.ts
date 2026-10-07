import { Controller, Get, Logger, Query, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { TokenInfo } from '@tet/backend/users/decorators/token-info.decorators';
import type { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import { ARCHIVE_ZIP_CONTENT_TYPE } from '@tet/backend/utils/archive/archive-assembly.service';
import { createControllerErrorHandler } from '@tet/backend/utils/nest/controller-error-handler';
import type { Response } from 'express';
import { createZodDto } from 'nestjs-zod';
import { downloadDossierDocumentsErrorConfig } from './download-dossier-documents.errors';
import {
  downloadDossierDocumentsQuerySchema,
  toDossierInstructionRef,
} from './download-dossier-documents.input';
import { DownloadDossierDocumentsService } from './download-dossier-documents.service';

class DownloadDossierDocumentsQueryClass extends createZodDto(
  downloadDossierDocumentsQuerySchema
) {}

const toExtValue = (filename: string): string =>
  encodeURIComponent(filename).replace(
    /['()*!]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );

/**
 * L'archive des documents d'un dossier PCAET, pour le service qui l'instruit.
 * En REST et non en tRPC : la réponse est un zip écrit en flux.
 */
@ApiExcludeController()
@Controller('demarches/pcaet/dossiers/documents')
export class DownloadDossierDocumentsController {
  private readonly logger = new Logger(DownloadDossierDocumentsController.name);

  constructor(
    private readonly downloadDossierDocumentsService: DownloadDossierDocumentsService
  ) {}

  private readonly getResultDataOrThrowError = createControllerErrorHandler(
    downloadDossierDocumentsErrorConfig
  );

  @Get('archive')
  @ApiUsage([ApiUsageEnum.APP])
  async downloadArchive(
    @Query() query: DownloadDossierDocumentsQueryClass,
    @TokenInfo() user: AuthenticatedUser,
    @Res() response: Response
  ): Promise<void> {
    const prepareResult =
      await this.downloadDossierDocumentsService.prepareArchive(
        toDossierInstructionRef(query),
        {
          user,
        }
      );
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
        `Archive of the dossier documents interrupted after the headers were sent`
      );
    }
  }
}
