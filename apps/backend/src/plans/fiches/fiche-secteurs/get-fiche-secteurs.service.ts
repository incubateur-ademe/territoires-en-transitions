import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result } from '@tet/backend/utils/result.type';
import {
  CommonError,
  CommonErrorEnum,
} from '@tet/backend/utils/trpc/common-errors';
import FicheActionPermissionsService from '../fiche-action-permissions.service';
import { CompleteFicheSecteursService } from './complete-fiche-secteurs.service';
import { GetFicheSecteursInput } from './get-fiche-secteurs.input';
import { GetFicheSecteursOutput } from './get-fiche-secteurs.output';

@Injectable()
export class GetFicheSecteursService {
  constructor(
    private readonly ficheActionPermissionsService: FicheActionPermissionsService,
    private readonly completeFicheSecteursService: CompleteFicheSecteursService
  ) {}

  async getSecteurs(
    { ficheId }: GetFicheSecteursInput,
    { user }: ServiceSecondArg
  ): Promise<Result<GetFicheSecteursOutput, CommonError>> {
    try {
      await this.ficheActionPermissionsService.canReadFiche(ficheId, user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return failure(CommonErrorEnum.NOT_FOUND);
      }
      if (error instanceof ForbiddenException) {
        return failure(CommonErrorEnum.UNAUTHORIZED);
      }
      return failure(CommonErrorEnum.SERVER_ERROR, error as Error);
    }

    return this.completeFicheSecteursService.completeSecteurs(ficheId);
  }
}
