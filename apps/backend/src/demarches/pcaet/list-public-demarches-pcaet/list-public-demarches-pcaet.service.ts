import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  DEMARCHE_PCAET_PUBLIC_STATUSES,
  type DemarchePcaetPublic,
} from '@tet/domain/demarches';
import { ListDemarchesPcaetRepository } from '../list-demarches-pcaet/list-demarches-pcaet.repository';
import { DemarchePcaetPublicAccessService } from '../shared/demarche-pcaet-public-access.service';
import { toDemarchePcaetPublic } from '../shared/models/demarche-pcaet-public.dto';
import {
  ListPublicDemarchesPcaetError,
  ListPublicDemarchesPcaetErrorEnum,
} from './list-public-demarches-pcaet.errors';
import { ListPublicDemarchesPcaetInput } from './list-public-demarches-pcaet.input';

@Injectable()
export class ListPublicDemarchesPcaetService {
  constructor(
    private readonly publicAccessService: DemarchePcaetPublicAccessService,
    private readonly listDemarchesPcaetRepository: ListDemarchesPcaetRepository
  ) {}

  async listPublicDemarchesPcaet(
    { collectiviteId }: ListPublicDemarchesPcaetInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaetPublic[], ListPublicDemarchesPcaetError>> {
    const accessResult = await this.publicAccessService.canReadCollectivite(
      collectiviteId,
      { user, tx }
    );
    if (!accessResult.success) {
      return failure(ListPublicDemarchesPcaetErrorEnum.UNAUTHORIZED);
    }

    const listResult =
      await this.listDemarchesPcaetRepository.listDemarchesPcaet(
        { collectiviteId, statuses: DEMARCHE_PCAET_PUBLIC_STATUSES },
        tx
      );
    if (!listResult.success) {
      return failure(
        ListPublicDemarchesPcaetErrorEnum.LIST_PUBLIC_DEMARCHES_PCAET_ERROR
      );
    }

    return success(listResult.data.map(toDemarchePcaetPublic));
  }
}
