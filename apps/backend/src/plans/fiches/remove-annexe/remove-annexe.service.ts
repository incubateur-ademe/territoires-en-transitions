import { Injectable } from '@nestjs/common';
import FicheActionPermissionsService from '@tet/backend/plans/fiches/fiche-action-permissions.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, Result } from '@tet/backend/utils/result.type';
import { CommonErrorEnum } from '@tet/backend/utils/trpc/common-errors';
import { RemoveAnnexeError } from './remove-annexe.errors';
import { RemoveAnnexeInput } from './remove-annexe.input';
import { RemoveAnnexeRepository } from './remove-annexe.repository';

@Injectable()
export class RemoveAnnexeService {
  constructor(
    private readonly ficheActionPermissionsService: FicheActionPermissionsService,
    private readonly removeAnnexeRepository: RemoveAnnexeRepository
  ) {}

  async removeAnnexe(
    input: RemoveAnnexeInput,
    user: AuthenticatedUser
  ): Promise<Result<{ id: number }, RemoveAnnexeError>> {
    const { annexeId } = input;

    const annexe = await this.removeAnnexeRepository.findById(annexeId);
    if (!annexe) {
      return failure(CommonErrorEnum.NOT_FOUND);
    }

    const accessMode = await this.ficheActionPermissionsService.canWriteFiche(
      annexe.ficheId,
      user,
      undefined,
      true
    );
    if (accessMode === null) {
      return failure(CommonErrorEnum.UNAUTHORIZED);
    }

    return this.removeAnnexeRepository.deleteById(annexeId);
  }
}
