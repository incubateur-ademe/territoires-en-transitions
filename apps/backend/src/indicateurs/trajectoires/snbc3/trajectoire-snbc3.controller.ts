import { Controller, Get, Logger, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiExcludeController, ApiTags } from '@nestjs/swagger';
import { collectiviteIdInputSchemaCoerce } from '@tet/backend/collectivites/collectivite-id.input';
import { TokenInfo } from '@tet/backend/users/decorators/token-info.decorators';
import type { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import { createControllerErrorHandler } from '@tet/backend/utils/nest/controller-error-handler';
import type { Response } from 'express';
import { createZodDto } from 'nestjs-zod';
import { pipeline } from 'node:stream/promises';
import { trajectoireSnbc3ErrorConfig } from './trajectoire-snbc3.errors';
import { TrajectoireSnbc3Service } from './trajectoire-snbc3.service';

class TrajectoireSnbc3CollectiviteQueryClass extends createZodDto(
  collectiviteIdInputSchemaCoerce
) {}

/**
 * Fichiers de la release SNBC 3 importée, réservés aux utilisateurs qui ont le
 * flag `is-trajectoire-snbc3-enabled`. Le lot 5 y ajoute le classeur
 * (`telechargement`, `outil`).
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

  constructor(private readonly service: TrajectoireSnbc3Service) {}

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
