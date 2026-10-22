import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { GetReferentsAccessInput } from '../get-referents-access/get-referents-access.input';
import { ReferentsPcaetPermissionsService } from '../referents-pcaet-permissions.service';
import {
  ReferentsPcaetError,
  ReferentsPcaetErrorEnum,
} from '../referents-pcaet.errors';
import { ReferentsPcaetRepository } from '../referents-pcaet.repository';

@Injectable()
export class ListReferentsRegionsService {
  constructor(
    private readonly permissionsService: ReferentsPcaetPermissionsService,
    private readonly referentsRepository: ReferentsPcaetRepository
  ) {}

  async listRegions(
    { collectiviteId }: GetReferentsAccessInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<{ code: string; libelle: string }[], ReferentsPcaetError>> {
    const { canRead } = await this.permissionsService.getAccess(
      collectiviteId,
      { user, tx }
    );
    if (!canRead) {
      return failure(ReferentsPcaetErrorEnum.UNAUTHORIZED);
    }
    return success(await this.referentsRepository.listRegions(tx));
  }
}
