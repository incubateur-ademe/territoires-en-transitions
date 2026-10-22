import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ReferentsPcaetPermissionsService } from '../referents-pcaet-permissions.service';
import {
  ReferentsPcaetError,
  ReferentsPcaetErrorEnum,
} from '../referents-pcaet.errors';
import { ReferentsPcaetRepository } from '../referents-pcaet.repository';
import { RemoveReferentInput } from './remove-referent.input';

@Injectable()
export class RemoveReferentService {
  constructor(
    private readonly permissionsService: ReferentsPcaetPermissionsService,
    private readonly referentsRepository: ReferentsPcaetRepository
  ) {}

  async remove(
    { collectiviteId, referentId }: RemoveReferentInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<void, ReferentsPcaetError>> {
    const { canMutate } = await this.permissionsService.getAccess(
      collectiviteId,
      { user, tx }
    );
    if (!canMutate) {
      return failure(ReferentsPcaetErrorEnum.UNAUTHORIZED);
    }

    const deleted = await this.referentsRepository.delete(referentId, tx);
    return deleted
      ? success(undefined)
      : failure(ReferentsPcaetErrorEnum.REFERENT_NOT_FOUND);
  }
}
