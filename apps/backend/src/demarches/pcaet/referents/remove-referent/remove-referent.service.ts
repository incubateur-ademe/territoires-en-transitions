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
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import { DemarchePcaetEventEnum } from '../../shared/tracking/demarche-pcaet-tracking.constants';

@Injectable()
export class RemoveReferentService {
  constructor(
    private readonly permissionsService: ReferentsPcaetPermissionsService,
    private readonly referentsRepository: ReferentsPcaetRepository,
    private readonly trackingService: TrackingService
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
    if (!deleted) {
      return failure(ReferentsPcaetErrorEnum.REFERENT_NOT_FOUND);
    }
    // Pas une démarche : l'événement porte le groupe de l'organisme référent.
    this.trackingService.capture({
      distinctId: user.id,
      event: DemarchePcaetEventEnum.REFERENT_RETIRE,
      properties: {
        organisme_id: deleted.organismeId,
        avec_compte: deleted.avecCompte,
      },
      groups: { collectivite: String(deleted.organismeId) },
    });
    return success(undefined);
  }
}
