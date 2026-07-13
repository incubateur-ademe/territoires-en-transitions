import { Injectable } from '@nestjs/common';
import FicheActionPermissionsService from '@tet/backend/plans/fiches/fiche-action-permissions.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result } from '@tet/backend/utils/result.type';
import { CommonErrorEnum } from '@tet/backend/utils/trpc/common-errors';
import { Annexe } from '@tet/domain/collectivites';
import { AddAnnexeError } from './add-annexe.errors';
import { AddAnnexeInput } from './add-annexe.input';
import {
  AddAnnexeRepository,
  AnnexeInsert,
  AnnexeRow,
} from './add-annexe.repository';

@Injectable()
export class AddAnnexeService {
  constructor(
    private readonly ficheActionPermissionsService: FicheActionPermissionsService,
    private readonly addAnnexeRepository: AddAnnexeRepository
  ) {}

  async addAnnexe(
    input: AddAnnexeInput,
    user: AuthenticatedUser
  ): Promise<Result<Annexe, AddAnnexeError>> {
    const { ficheId } = input;

    const fiche = await this.ficheActionPermissionsService.getFicheFromId(
      ficheId
    );
    if (!fiche) {
      return failure(CommonErrorEnum.NOT_FOUND);
    }

    const collectiviteId = fiche.collectiviteId;

    const accessMode = await this.ficheActionPermissionsService.canWriteFiche(
      ficheId,
      user,
      undefined,
      true
    );
    if (accessMode === null) {
      return failure(CommonErrorEnum.UNAUTHORIZED);
    }

    const commentaire = input.commentaire ?? '';

    if ('fichierId' in input) {
      const fichierCollectiviteId =
        await this.addAnnexeRepository.getFichierCollectiviteId(input.fichierId);
      if (fichierCollectiviteId !== collectiviteId) {
        return failure(CommonErrorEnum.NOT_FOUND);
      }
      return this.addAnnexeRepository.addFile({
        ...input,
        collectiviteId,
        commentaire,
        modifiedBy: user.id,
      });
    }

    return this.addAnnexeRepository.addUrl({
      ...input,
      collectiviteId,
      commentaire,
      modifiedBy: user.id,
    });
  }

  loadRawAnnexesForDuplication(
    ficheId: number,
    collectiviteId: number,
    tx: Transaction
  ): Promise<AnnexeRow[]> {
    return this.addAnnexeRepository.loadRawAnnexesForDuplication(
      ficheId,
      collectiviteId,
      tx
    );
  }

  insertAnnexes(
    annexes: AnnexeInsert[],
    tx: Transaction
  ): Promise<Result<undefined, AddAnnexeError>> {
    return this.addAnnexeRepository.insertAnnexes(annexes, tx);
  }
}
