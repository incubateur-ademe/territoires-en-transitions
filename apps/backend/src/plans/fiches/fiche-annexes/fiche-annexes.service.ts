import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  CommonError,
  CommonErrorEnum,
} from '@tet/backend/utils/trpc/common-errors';
import { AnnexeDocument } from '@tet/domain/plans';
import { ResourceType } from '@tet/domain/users';
import type { FicheAnnexesInput } from './fiche-annexes.input';
import type { FicheAnnexesOutput } from './fiche-annexes.output';
import { AnnexeListRow, FicheAnnexesRepository } from './fiche-annexes.repository';

@Injectable()
export class FicheAnnexesService {
  private readonly logger = new Logger(FicheAnnexesService.name);

  constructor(
    private readonly ficheAnnexesRepository: FicheAnnexesRepository,
    private readonly permissionService: PermissionService
  ) {}

  async listForFiches(
    input: FicheAnnexesInput,
    user: AuthenticatedUser
  ): Promise<Result<FicheAnnexesOutput, CommonError>> {
    const isAllowed = await this.permissionService.isAllowed(
      user,
      'collectivites.documents.read',
      ResourceType.COLLECTIVITE,
      input.collectiviteId,
      true
    );
    if (!isAllowed) {
      return failure(CommonErrorEnum.UNAUTHORIZED);
    }

    const canReadConfidentiel = await this.permissionService.isAllowed(
      user,
      'collectivites.documents.read_confidentiel',
      ResourceType.COLLECTIVITE,
      input.collectiviteId,
      true
    );

    try {
      const rows = await this.ficheAnnexesRepository.findByFicheIds(
        input.collectiviteId,
        input.ficheIds,
        canReadConfidentiel
      );

      this.logger.log(
        `${rows.length} annexe(s) listée(s) pour les fiches ${input.ficheIds}`
      );

      const mapped: FicheAnnexesOutput = rows.map((row) =>
        rowToAnnexeOutputItem(row)
      );

      return success(mapped);
    } catch (error) {
      this.logger.error(
        `Erreur lors du chargement des annexes des fiches ${input.ficheIds}`,
        error
      );
      return failure(CommonErrorEnum.DATABASE_ERROR);
    }
  }
}

function rowToAnnexeOutputItem(row: AnnexeListRow): AnnexeDocument {
  const common = {
    id: row.id,
    collectiviteId: row.collectiviteId,
    ficheId: row.ficheId,
    commentaire: row.commentaire,
    modifiedAt: row.modifiedAt,
    modifiedByNom: row.modifiedByNom,
  };

  // vérifie fichierId pour distinguer fichier vs lien (schéma de sortie discriminant)
  if (row.fichierId !== null) {
    return {
      ...common,
      fichier: {
        filename: row.filename,
        confidentiel: row.confidentiel,
        hash: row.hash,
        bucketId: row.bucketId,
        filesize: row.filesize,
      },
      lien: null,
    };
  }

  return {
    ...common,
    fichier: null,
    lien: row.lien ?? { titre: '', url: '' },
  };
}
