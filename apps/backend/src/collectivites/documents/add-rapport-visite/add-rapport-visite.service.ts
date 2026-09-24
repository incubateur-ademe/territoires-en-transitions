import { BibliothequeFichierRepository } from '@tet/backend/collectivites/documents/bibliotheque-fichier.repository';
import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result } from '@tet/backend/utils/result.type';
import {
  CommonError,
  CommonErrorEnum,
} from '@tet/backend/utils/trpc/common-errors';
import { PreuveRapport } from '@tet/domain/collectivites';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { AddRapportVisiteInput } from './add-rapport-visite.input';
import { AddRapportVisiteRepository } from './add-rapport-visite.repository';

@Injectable()
export class AddRapportVisiteService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly addRapportVisiteRepository: AddRapportVisiteRepository,
    private readonly bibliothequeFichierRepository: BibliothequeFichierRepository
  ) {}

  async addRapportVisite(
    input: AddRapportVisiteInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<PreuveRapport, CommonError>> {
    const { collectiviteId } = input;

    const permissionResult = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['COLLECTIVITES.DOCUMENTS.MUTATE'],
      ResourceType.COLLECTIVITE,
      { collectiviteId },
      tx
    );
    if (!permissionResult.success) {
      return failure(CommonErrorEnum.UNAUTHORIZED);
    }

    const commentaire = input.commentaire ?? '';

    const hasFichier = input.fichierId !== undefined;

    if (hasFichier) {
      const isFichierOwnedByCollectivite =
        await this.bibliothequeFichierRepository.isFichierOwnedByCollectivite(
          { fichierId: input.fichierId, collectiviteId },
          tx
        );
      if (!isFichierOwnedByCollectivite) {
        return failure(CommonErrorEnum.NOT_FOUND);
      }

      return this.addRapportVisiteRepository.addRapportVisiteWithFichier(
        { ...input, commentaire, modifiedBy: user.id },
        tx
      );
    }

    return this.addRapportVisiteRepository.addRapportVisiteWithLien(
      { ...input, commentaire, modifiedBy: user.id },
      tx
    );
  }
}
