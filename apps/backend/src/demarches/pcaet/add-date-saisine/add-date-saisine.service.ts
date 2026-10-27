import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { DepotPermissionsService } from '../shared/depot-permissions.service';
import {
  AddDateSaisineError,
  AddDateSaisineErrorEnum,
} from './add-date-saisine.errors';
import { AddDateSaisineInput } from './add-date-saisine.input';
import { AddDateSaisineRepository } from './add-date-saisine.repository';

@Injectable()
export class AddDateSaisineService {
  constructor(
    private readonly depotPermissionsService: DepotPermissionsService,
    private readonly addDateSaisineRepository: AddDateSaisineRepository
  ) {}

  async addDateSaisine(
    { demandeAvisId, dateSaisine }: AddDateSaisineInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<void, AddDateSaisineError>> {
    const permissionResult =
      await this.depotPermissionsService.canModifierDateSaisine(
        demandeAvisId,
        { user, tx }
      );
    if (!permissionResult.success) {
      return failure(permissionResult.error);
    }
    const { demarcheId } = permissionResult.data;

    if (
      !(await this.addDateSaisineRepository.isTransmisHorsPlateforme(
        demarcheId,
        tx
      ))
    ) {
      return failure(AddDateSaisineErrorEnum.DEPOT_TRANSMIS_SUR_PLATEFORME);
    }

    await this.addDateSaisineRepository.insert(
      { demarcheId, dateSaisine, userId: user.id },
      tx
    );

    return success(undefined);
  }
}
