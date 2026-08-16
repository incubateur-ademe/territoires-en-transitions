import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { DepotPermissionsService } from '../shared/depot-permissions.service';
import { PcaetAvis } from '../shared/models/pcaet-avis.dto';
import { PcaetAvisRepository } from '../shared/pcaet-avis.repository';
import { ValiderAvisError, ValiderAvisErrorEnum } from './valider-avis.errors';
import { ValiderAvisInput } from './valider-avis.input';

@Injectable()
export class ValiderAvisService {
  constructor(
    private readonly depotPermissionsService: DepotPermissionsService,
    private readonly pcaetAvisRepository: PcaetAvisRepository
  ) {}

  async validerAvis(
    { demandeAvisId, avisId }: ValiderAvisInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<PcaetAvis[], ValiderAvisError>> {
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
      return failure(ValiderAvisErrorEnum.AVIS_NOT_FOUND);
    }

    if (avis.fichierRef === null) {
      return failure(ValiderAvisErrorEnum.AVIS_SANS_PIECE_JOINTE);
    }

    if (avis.valideLe === null) {
      await this.pcaetAvisRepository.valider({ demandeAvisId, avisId }, tx);
    }

    return success(
      await this.pcaetAvisRepository.listByDemande(demandeAvisId, tx)
    );
  }
}
