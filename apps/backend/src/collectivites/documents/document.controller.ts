/// <reference types="multer" />
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Next,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiExcludeController,
  ApiOkResponse,
} from '@nestjs/swagger';
import { COLLECTIVITE_ID_PARAM_KEY } from '@tet/backend/collectivites/collectivite-api.constants';
import DocumentService from '@tet/backend/collectivites/documents/document.service';
import { DOCUMENT_ID_PARAM_KEY } from '@tet/backend/collectivites/documents/models/document-api.constants';
import { StoreDocumentService } from '@tet/backend/collectivites/documents/store-document/store-document.service';
import { TokenInfo } from '@tet/backend/users/decorators/token-info.decorators';
import type {
  AuthenticatedUser,
  AuthUser,
} from '@tet/backend/users/models/auth.models';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import { createControllerErrorHandler } from '@tet/backend/utils/nest/controller-error-handler';
import type { NextFunction, Response } from 'express';
import { Readable } from 'stream';
import { storeDocumentErrorConfig } from './store-document/store-document.errors';

// Type for multer file upload
type MulterFile = Express.Multer.File;

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

@ApiExcludeController()
@ApiBearerAuth()
@Controller()
export class DocumentController {
  constructor(
    private readonly documentService: DocumentService,
    private readonly storeDocumentService: StoreDocumentService
  ) {}

  @Get(DocumentService.DOWNLOAD_ROUTE)
  @ApiUsage([ApiUsageEnum.DEBUG])
  @ApiOkResponse({
    description: "Téléchargement d'un document",
  })
  async downloadDocument(
    @Param(COLLECTIVITE_ID_PARAM_KEY) collectiviteIdString: string,
    @Param(DOCUMENT_ID_PARAM_KEY) fileId: string,
    @TokenInfo() user: AuthUser,
    @Res() res: Response,
    @Next() next: NextFunction
  ) {
    try {
      const collectiviteIdNumber = parseInt(collectiviteIdString);
      if (isNaN(collectiviteIdNumber)) {
        throw new BadRequestException('Invalid collectivite ID');
      }
      const { fileName, blob } = await this.documentService.downloadFile(
        collectiviteIdNumber,
        fileId,
        user
      );

      res.setHeader('Content-Type', blob.type || 'application/octet-stream');
      res.attachment(fileName);
      res.set('Access-Control-Expose-Headers', 'Content-Disposition');

      // @ts-expect-error - blob.stream() is not typed
      const stream = Readable.fromWeb(blob.stream());
      stream.pipe(res);
    } catch (error) {
      next(error);
    }

    return;
  }

  @Post(DocumentService.UPLOAD_ROUTE)
  @ApiUsage([ApiUsageEnum.APP])
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({
    description: "Upload et création d'un document",
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_FILE_SIZE,
      },
    })
  )
  async uploadDocument(
    @Param(COLLECTIVITE_ID_PARAM_KEY) collectiviteIdParam: string,
    @UploadedFile()
    file: MulterFile,
    @TokenInfo() user: AuthenticatedUser,
    @Body('confidentiel') confidentiel?: string
  ) {
    const collectiviteIdNumber = parseInt(collectiviteIdParam);
    if (isNaN(collectiviteIdNumber)) {
      throw new BadRequestException('Invalid collectivite ID');
    }
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const isConfidentiel =
      confidentiel?.toLowerCase() === 'true' ? true : false;

    const result = await this.storeDocumentService.uploadBuffer(
      collectiviteIdNumber,
      file,
      isConfidentiel,
      user
    );

    const getResultDataOrThrowError = createControllerErrorHandler(
      storeDocumentErrorConfig
    );

    return getResultDataOrThrowError(result);
  }
}
