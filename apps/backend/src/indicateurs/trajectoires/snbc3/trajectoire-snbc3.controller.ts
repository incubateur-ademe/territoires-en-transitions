import { Controller, Get, Logger, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiExcludeController, ApiTags } from '@nestjs/swagger';
import { collectiviteIdInputSchemaCoerce } from '@tet/backend/collectivites/collectivite-id.input';
import { TokenInfo } from '@tet/backend/users/decorators/token-info.decorators';
import type { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import { buildAttachmentContentDisposition } from '@tet/backend/utils/archive/build-content-disposition.utils';
import { createControllerErrorHandler } from '@tet/backend/utils/nest/controller-error-handler';
import type { Response } from 'express';
import { createZodDto } from 'nestjs-zod';
import { pipeline } from 'node:stream/promises';
import {
  Snbc3Workbook,
  ExportTrajectoireSnbc3Service,
} from '../export-trajectoire-snbc3/export-trajectoire-snbc3.service';
import { XLSX_MIME_TYPE } from '../import-snbc3/snbc3-release-storage.service';
import { trajectoireSnbc3ErrorConfig } from './trajectoire-snbc3.errors';
import { TrajectoireSnbc3Service } from './trajectoire-snbc3.service';

class TrajectoireSnbc3CollectiviteQueryClass extends createZodDto(
  collectiviteIdInputSchemaCoerce
) {}

/**
 * Fichiers de la release SNBC 3 importée, réservés aux utilisateurs qui ont le
 * flag `is-trajectoire-snbc3-enabled` : PDF de méthodologie et classeur
 * standalone (`telechargement`, `outil`).
 */
@ApiTags('Trajectoires')
@ApiBearerAuth()
@ApiExcludeController()
@Controller('trajectoires/snbc3')
export class TrajectoireSnbc3Controller {
  private readonly logger = new Logger(TrajectoireSnbc3Controller.name);
  private readonly getResultDataOrThrowError = createControllerErrorHandler(
    trajectoireSnbc3ErrorConfig
  );

  constructor(
    private readonly service: TrajectoireSnbc3Service,
    private readonly exportService: ExportTrajectoireSnbc3Service
  ) {}

  /** « Mes données » : le classeur ouvert sur le territoire de la collectivité. */
  @ApiUsage([ApiUsageEnum.APP])
  @Get('telechargement')
  async downloadCollectiviteWorkbook(
    @Query() { collectiviteId }: TrajectoireSnbc3CollectiviteQueryClass,
    @TokenInfo() user: AuthenticatedUser,
    @Res() res: Response
  ) {
    const workbook = this.getResultDataOrThrowError(
      await this.exportService.getCollectiviteWorkbook(
        { collectiviteId },
        { user }
      )
    );
    this.logger.log(
      `Téléchargement du classeur SNBC 3 de la collectivité ${collectiviteId} (${workbook.fileName})`
    );
    this.sendWorkbook(res, workbook);
  }

  /** « Outil Excel SNBC 3 » : le classeur tel qu'il est publié. */
  @ApiUsage([ApiUsageEnum.APP])
  @Get('outil')
  async downloadWorkbook(
    @Query() { collectiviteId }: TrajectoireSnbc3CollectiviteQueryClass,
    @TokenInfo() user: AuthenticatedUser,
    @Res() res: Response
  ) {
    const workbook = this.getResultDataOrThrowError(
      await this.exportService.getWorkbook({ collectiviteId }, { user })
    );
    this.logger.log(
      `Téléchargement de l'outil Excel SNBC 3 (${workbook.fileName})`
    );
    this.sendWorkbook(res, workbook);
  }

  private sendWorkbook(res: Response, { content, fileName }: Snbc3Workbook) {
    // `filename*` UTF-8 : `res.attachment` met un nom Latin-1 tel quel, que
    // `res.send` abîme (« é » → « ý »).
    res.set('Content-Disposition', buildAttachmentContentDisposition(fileName));
    res.set('Access-Control-Expose-Headers', 'Content-Disposition');
    res.type(XLSX_MIME_TYPE);
    res.send(content);
  }

  /** PDF de méthodologie de la release dont les valeurs sont en base. */
  @ApiUsage([ApiUsageEnum.APP])
  @Get('methodologie')
  async downloadMethodologie(
    @Query() { collectiviteId }: TrajectoireSnbc3CollectiviteQueryClass,
    @TokenInfo() user: AuthenticatedUser,
    @Res() res: Response
  ) {
    const { stream, fileName } = this.getResultDataOrThrowError(
      await this.service.getMethodologie({ collectiviteId }, { user })
    );
    this.logger.log(`Téléchargement de la méthodologie SNBC 3 (${fileName})`);

    res.attachment(fileName);
    res.set('Access-Control-Expose-Headers', 'Content-Disposition');
    res.type('application/pdf');
    try {
      await pipeline(stream, res);
    } catch (err) {
      this.logger.error(
        `Échec de l'envoi de la méthodologie SNBC 3 (${fileName})`,
        err
      );
      // en-têtes déjà envoyés : Nest ne peut plus répondre en erreur, on coupe
      // la connexion pour que le client voie un téléchargement interrompu
      if (res.headersSent) {
        res.destroy(err as Error);
        return;
      }
      throw err;
    }
  }
}
