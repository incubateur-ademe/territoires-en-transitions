import { Injectable } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import {
  NonReferentielPermissionOperation,
  PermissionService,
  ReferentielPermissionOperation,
} from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ResourceType } from '@tet/domain/users';

export const SUPER_ADMIN_REQUIRED_MESSAGE =
  "Accès refusé à cette collectivité. Un compte support doit activer le mode super admin dans l'app (menu du profil) pour lire les données d'une collectivité dont il n'est pas membre.";

export type CollectiviteAccessError = 'NOT_FOUND' | 'UNAUTHORIZED';

/**
 * Garde commune des outils métier : la collectivité existe et l'appelant a la
 * permission demandée dessus, dans sa variante confidentielle si la
 * collectivité est en accès restreint. Refuse par défaut, et dit au modèle
 * comment débloquer.
 */
@Injectable()
export class CollectiviteAccessService {
  constructor(
    private readonly collectivitesService: CollectivitesService,
    private readonly permissionService: PermissionService
  ) {}

  async assertAllowed(
    collectiviteId: number,
    operations:
      | {
          public: NonReferentielPermissionOperation;
          confidentiel: NonReferentielPermissionOperation;
        }
      | {
          public: ReferentielPermissionOperation;
          confidentiel: ReferentielPermissionOperation;
        },
    user: AuthenticatedUser
  ): Promise<Result<{ accesRestreint: boolean }, CollectiviteAccessError>> {
    let accesRestreint: boolean;
    try {
      accesRestreint = await this.collectivitesService.isPrivate(
        collectiviteId
      );
    } catch {
      return failure(
        'NOT_FOUND',
        new Error(`Collectivité ${collectiviteId} introuvable`)
      );
    }

    const operation = accesRestreint
      ? operations.confidentiel
      : operations.public;
    // Les opérations referentiels.* ont leur propre surcharge (rôle seul, sans
    // filtre de mode sur une collectivité) : même appel, typé séparément.
    const allowed = operation.startsWith('referentiels.')
      ? await this.permissionService.isAllowed(
          user,
          operation as ReferentielPermissionOperation,
          ResourceType.COLLECTIVITE,
          { collectiviteId }
        )
      : await this.permissionService.isAllowed(
          user,
          operation as NonReferentielPermissionOperation,
          ResourceType.COLLECTIVITE,
          { collectiviteId }
        );
    if (!allowed.success) {
      return failure('UNAUTHORIZED', new Error(SUPER_ADMIN_REQUIRED_MESSAGE));
    }
    return success({ accesRestreint });
  }
}
