import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { isOrganismeReferentPcaet } from '@tet/domain/demarches';
import { ReferentsPcaetPermissionsService } from '../referents-pcaet-permissions.service';
import {
  ReferentsPcaetError,
  ReferentsPcaetErrorEnum,
} from '../referents-pcaet.errors';
import { ReferentsPcaetRepository } from '../referents-pcaet.repository';
import { AddReferentInput } from './add-referent.input';

/** Désigner un référent n'envoie aucune notification. */
@Injectable()
export class AddReferentService {
  constructor(
    private readonly permissionsService: ReferentsPcaetPermissionsService,
    private readonly referentsRepository: ReferentsPcaetRepository
  ) {}

  async add(
    { collectiviteId, organismeId, ...referent }: AddReferentInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<void, ReferentsPcaetError>> {
    const { canMutate } = await this.permissionsService.getAccess(
      collectiviteId,
      { user, tx }
    );
    if (!canMutate) {
      return failure(ReferentsPcaetErrorEnum.UNAUTHORIZED);
    }

    const organisme = await this.referentsRepository.getOrganisme(
      organismeId,
      tx
    );
    if (!organisme || !isOrganismeReferentPcaet(organisme.type)) {
      return failure(ReferentsPcaetErrorEnum.ORGANISME_INVALIDE);
    }

    if (
      'userId' in referent &&
      !(await this.referentsRepository.isMembreActif(
        referent.userId,
        organismeId,
        tx
      ))
    ) {
      return failure(ReferentsPcaetErrorEnum.PAS_MEMBRE_ORGANISME);
    }

    await this.referentsRepository.insert(organismeId, referent, user.id, tx);
    return success(undefined);
  }
}
