import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  PermissionOperationEnum,
  ResourceType,
} from '@tet/domain/users';

/**
 * **Asymétrie volontaire avec le chemin unitaire `CreateFicheService.createFiche` :**
 * la création par token requiert `PLANS.FICHES.CREATE` au niveau collectivité
 * pour TOUTES les fiches, y compris les sous-actions. Le chemin unitaire, lui,
 * accepte qu'un contributeur sans `FICHES.CREATE` crée une sous-action via
 * `update_piloted_by_me` hérité du parent. Le bulk est volontairement plus
 * strict (un seul check, pas d'héritage par-fiche).
 */
export class FicheCreateAuthorization {
  private constructor(
    public readonly user: AuthenticatedUser,
    public readonly collectiviteId: number
  ) {}

  static async forCollectivite(
    permissionService: PermissionService,
    user: AuthenticatedUser,
    collectiviteId: number,
    tx?: Transaction
  ): Promise<FicheCreateAuthorization> {
    await permissionService.isAllowed(
      user,
      PermissionOperationEnum['PLANS.FICHES.CREATE'],
      ResourceType.COLLECTIVITE,
      collectiviteId,
      false,
      tx
    );
    return new FicheCreateAuthorization(user, collectiviteId);
  }
}
