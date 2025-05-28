import { AllowAnonymousAccess } from '@/backend/auth/decorators/allow-anonymous-access.decorator';
import { TokenInfo } from '@/backend/auth/decorators/token-info.decorators';
import { AuthUser } from '@/backend/auth/index-domain';
import { COLLECTIVITE_ID_PARAM_KEY } from '@/backend/collectivites/collectivite-api.constants';
import { DOCUMENT_ID_PARAM_KEY } from '@/backend/collectivites/documents/models/document-api.constants';
import DocumentService from '@/backend/collectivites/documents/services/document.service';
import { ApiUsageEnum } from '@/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@/backend/utils/api/api-usage.decorator';
import { Controller, Get, Next, Param, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExcludeController,
  ApiOkResponse,
} from '@nestjs/swagger';
import { NextFunction, Response } from 'express';
import { Readable } from 'stream';

@ApiExcludeController()
@ApiBearerAuth()
@Controller()
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @AllowAnonymousAccess()
  @Get(DocumentService.DOWNLOAD_ROUTE)
  @ApiUsage([ApiUsageEnum.DEBUG])
  @ApiOkResponse({
    description: "Téléchargement d'un document",
  })
  async getCollectivite(
    @Param(COLLECTIVITE_ID_PARAM_KEY) collectiviteId: number,
    @Param(DOCUMENT_ID_PARAM_KEY) fileId: string,
    @TokenInfo() user: AuthUser,
    @Res() res: Response,
    @Next() next: NextFunction
  ) {
    // TODO: check access rights
    try {
      const { fileName, blob } = await this.documentService.downloadFile(
        collectiviteId,
        fileId
      );

      res.setHeader('Content-Type', blob.type || 'application/octet-stream');
      res.attachment(fileName);
      res.set('Access-Control-Expose-Headers', 'Content-Disposition');

      // @ts-ignore
      const stream = Readable.fromWeb(blob.stream());
      stream.pipe(res);
    } catch (error) {
      next(error);
    }

    return;
  }
}
