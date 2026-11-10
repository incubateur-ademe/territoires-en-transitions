import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { DepotPermissionsService } from '../shared/depot-permissions.service';
import { PcaetAvis } from '../shared/models/pcaet-avis.dto';
import { PcaetAvisRepository } from '../shared/pcaet-avis.repository';
import { DeleteAvisError, DeleteAvisErrorEnum } from './delete-avis.errors';
import { DeleteAvisInput } from './delete-avis.input';
import { DemarchePcaetEventEnum } from '../shared/tracking/demarche-pcaet-tracking.constants';
import { DemarchePcaetTrackingService } from '../shared/tracking/demarche-pcaet-tracking.service';

@Injectable()
export class DeleteAvisService {
  constructor(
    private readonly depotPermissionsService: DepotPermissionsService,
    private readonly pcaetAvisRepository: PcaetAvisRepository,
    private readonly trackingService: DemarchePcaetTrackingService
  ) {}

  async deleteAvis(
    { demandeAvisId, avisId }: DeleteAvisInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<PcaetAvis[], DeleteAvisError>> {
    const permissionResult = await this.depotPermissionsService.canDeposerAvis(
      demandeAvisId,
      { user, tx }
    );
    if (!permissionResult.success) {
      return failure(permissionResult.error);
    }

    const avis = await this.pcaetAvisRepository.findById(
      { demandeAvisId, avisId },
      tx
    );
    if (!avis) {
      return failure(DeleteAvisErrorEnum.AVIS_NOT_FOUND);
    }

    if (avis.valideLe !== null) {
      return failure(DeleteAvisErrorEnum.AVIS_VALIDE_NON_SUPPRIMABLE);
    }

    await this.pcaetAvisRepository.delete({ demandeAvisId, avisId }, tx);
    this.trackingService.trackInstructeur(
      DemarchePcaetEventEnum.AVIS_SUPPRIME,
      permissionResult.data,
      {
        userId: user.id,
        properties: {
          auTitreDe: avis.auTitreDe,
          nbPieces: avis.fichierRefs.length,
        },
      }
    );

    return success(
      await this.pcaetAvisRepository.listByDemande(demandeAvisId, tx)
    );
  }
}
