import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  DemarcheTypeEnum,
  type DemarcheDocumentsSnapshot,
} from '@tet/domain/demarches';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { DemarcheDocumentsRepository } from '@tet/backend/demarches/shared/demarche-documents.repository';
import { DemarchePcaetRefRepository } from '../../shared/demarche-pcaet-ref.repository';
import {
  ListDemarchePcaetDocumentsError,
  ListDemarchePcaetDocumentsErrorEnum,
} from './list-documents.errors';
import { ListDemarchePcaetDocumentsInput } from './list-documents.input';

@Injectable()
export class ListDemarchePcaetDocumentsService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly demarchePcaetRefRepository: DemarchePcaetRefRepository,
    private readonly demarcheDocumentsRepository: DemarcheDocumentsRepository
  ) {}

  /**
   * Modèle de démarche et pièces déposées. La règle de couverture n'est pas
   * appliquée ici : l'appelant utilise les fonctions pures du domaine sur ce
   * même snapshot, comme le guard `dossierComplet`.
   */
  async listDocuments(
    input: ListDemarchePcaetDocumentsInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarcheDocumentsSnapshot, ListDemarchePcaetDocumentsError>> {
    const demarche = await this.demarchePcaetRefRepository.findRef(
      input,
      undefined,
      tx
    );
    if (!demarche) {
      return failure(
        ListDemarchePcaetDocumentsErrorEnum.DEMARCHE_PCAET_NOT_FOUND
      );
    }

    const permissionResult = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['DEMARCHES.PCAET.MUTATE'],
      ResourceType.COLLECTIVITE,
      { collectiviteId: demarche.collectiviteId },
      tx
    );
    if (!permissionResult.success) {
      return failure(ListDemarchePcaetDocumentsErrorEnum.UNAUTHORIZED);
    }

    const snapshot = await this.demarcheDocumentsRepository.loadSnapshot(
      { demarcheId: demarche.id, demarcheType: DemarcheTypeEnum.PCAET },
      tx
    );
    return success(snapshot);
  }
}
