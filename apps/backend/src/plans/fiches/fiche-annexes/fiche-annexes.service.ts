import { Injectable } from '@nestjs/common';
import FicheActionPermissionsService from '@tet/backend/plans/fiches/fiche-action-permissions.service';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { CommonError } from '@tet/backend/utils/trpc/common-errors';
import type { AnnexeInfo } from '@tet/domain/collectivites';
import type { FicheWithRelations } from '@tet/domain/plans';
import { FicheAnnexesRepository } from './fiche-annexes.repository';

@Injectable()
export class FicheAnnexesService {
  constructor(
    private readonly fichePermissions: FicheActionPermissionsService,
    private readonly repository: FicheAnnexesRepository
  ) {}

  async listForFiche(
    fiche: FicheWithRelations,
    user: AuthUser
  ): Promise<Result<AnnexeInfo[], CommonError>> {
    const access = await this.fichePermissions.canReadFicheObject(
      fiche,
      user,
      true
    );
    if (access === null) {
      return failure('UNAUTHORIZED');
    }
    const annexes = await this.repository.listByFicheId(fiche.id);
    return success(annexes);
  }
}
