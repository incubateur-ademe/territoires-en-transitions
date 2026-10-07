/// <reference types="multer" />
import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiExcludeController } from '@nestjs/swagger';
import {
  COLLECTIVITE_ID_PARAM_KEY,
  COLLECTIVITE_ID_ROUTE_PARAM,
} from '@tet/backend/collectivites/collectivite-api.constants';
import { TokenInfo } from '@tet/backend/users/decorators/token-info.decorators';
import type { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import { createControllerErrorHandler } from '@tet/backend/utils/nest/controller-error-handler';
import { AI_PLAN_IMPORT_MAX_SOURCE_BYTES } from '../ai-plan-import.constants';
import { aiPlanImportErrorConfig } from '../ai-plan-import.trpc-errors';
import { enqueueImportFormSchema } from './enqueue-import.input';
import { EnqueueImportService } from './enqueue-import.service';

export const ENQUEUE_IMPORT_ROUTE = `collectivites/${COLLECTIVITE_ID_ROUTE_PARAM}/plans/import-ia`;

@ApiExcludeController()
@ApiBearerAuth()
@Controller()
export class EnqueueImportController {
  constructor(private readonly enqueueImportService: EnqueueImportService) {}

  private readonly getResultDataOrThrowError = createControllerErrorHandler(
    aiPlanImportErrorConfig
  );

  @Post(ENQUEUE_IMPORT_ROUTE)
  @ApiUsage([ApiUsageEnum.APP])
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: AI_PLAN_IMPORT_MAX_SOURCE_BYTES },
    })
  )
  async enqueueImport(
    @Param(COLLECTIVITE_ID_PARAM_KEY) collectiviteIdParam: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @TokenInfo() user: AuthenticatedUser,
    @Body() body: unknown
  ): Promise<{ jobId: string }> {
    const collectiviteId = parseInt(collectiviteIdParam, 10);
    if (Number.isNaN(collectiviteId)) {
      throw new BadRequestException('Identifiant de collectivité invalide');
    }
    if (!file) {
      throw new BadRequestException('Un fichier est requis');
    }

    const parsedForm = enqueueImportFormSchema.safeParse(body);
    if (!parsedForm.success) {
      throw new BadRequestException("Champs du formulaire d'import invalides");
    }

    const result = await this.enqueueImportService.enqueue({
      collectiviteId,
      user,
      file: {
        buffer: file.buffer,
        mimeType: file.mimetype,
        size: file.size,
      },
      options: parsedForm.data,
    });

    return this.getResultDataOrThrowError(result);
  }
}
