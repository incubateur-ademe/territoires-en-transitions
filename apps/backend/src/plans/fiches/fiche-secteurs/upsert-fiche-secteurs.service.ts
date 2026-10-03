import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  CommonError,
  CommonErrorEnum,
} from '@tet/backend/utils/trpc/common-errors';
import { uniq } from 'es-toolkit';
import FicheActionPermissionsService from '../fiche-action-permissions.service';
import { FicheSecteursAttributionRepository } from './fiche-secteurs-attribution.repository';
import { toFicheSecteurs } from './fiche-secteurs.rules';
import { GetFicheSecteursOutput } from './get-fiche-secteurs.output';
import { UpsertFicheSecteursInput } from './upsert-fiche-secteurs.input';

@Injectable()
export class UpsertFicheSecteursService {
  private readonly logger = new Logger(UpsertFicheSecteursService.name);

  constructor(
    private readonly ficheActionPermissionsService: FicheActionPermissionsService,
    private readonly attributionRepository: FicheSecteursAttributionRepository
  ) {}

  async upsertSecteurs(
    { ficheId, secteurs }: UpsertFicheSecteursInput,
    { user }: ServiceSecondArg
  ): Promise<Result<GetFicheSecteursOutput, CommonError>> {
    try {
      await this.ficheActionPermissionsService.canWriteFiche(ficheId, user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return failure(CommonErrorEnum.NOT_FOUND);
      }
      if (error instanceof ForbiddenException) {
        return failure(CommonErrorEnum.UNAUTHORIZED);
      }
      return failure(CommonErrorEnum.SERVER_ERROR, error as Error);
    }

    try {
      const saved = await this.attributionRepository.upsertManuelle({
        ficheId,
        secteurs: uniq(secteurs),
        modifiedBy: user.id,
      });
      return success(toFicheSecteurs(saved));
    } catch (error) {
      this.logger.error(
        `Erreur à l'enregistrement des secteurs de la fiche ${ficheId}`,
        error
      );
      return failure(CommonErrorEnum.DATABASE_ERROR, error as Error);
    }
  }
}
