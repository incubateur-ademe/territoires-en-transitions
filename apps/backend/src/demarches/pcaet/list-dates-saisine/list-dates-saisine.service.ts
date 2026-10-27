import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { DepotPermissionsService } from '../shared/depot-permissions.service';
import { ListDatesSaisineError } from './list-dates-saisine.errors';
import { ListDatesSaisineInput } from './list-dates-saisine.input';
import { DateSaisine } from './list-dates-saisine.output';
import { ListDatesSaisineRepository } from './list-dates-saisine.repository';

@Injectable()
export class ListDatesSaisineService {
  constructor(
    private readonly depotPermissionsService: DepotPermissionsService,
    private readonly listDatesSaisineRepository: ListDatesSaisineRepository
  ) {}

  async listDatesSaisine(
    { demandeAvisId }: ListDatesSaisineInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DateSaisine[], ListDatesSaisineError>> {
    const permissionResult =
      await this.depotPermissionsService.canConsulterDepot(demandeAvisId, {
        user,
        tx,
      });
    if (!permissionResult.success) {
      return failure(permissionResult.error);
    }

    return success(
      await this.listDatesSaisineRepository.listByDemandeAvis(demandeAvisId, tx)
    );
  }
}
