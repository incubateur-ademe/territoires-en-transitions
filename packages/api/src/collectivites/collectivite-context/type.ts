import { ContexteInstruction } from '@tet/domain/demarches';
import { ReferentielId } from '@tet/domain/referentiels';
import {
  CollectiviteRolesAndPermissions,
  PermissionOperation,
  UserInfo,
} from '@tet/domain/users';

/**
 * La collectivité courante, plus le dossier d'instruction par lequel on y est
 * venu : l'agent d'un service qui l'instruit y arrive depuis un dossier, et le
 * contexte le suit tant qu'il reste dans la collectivité. Hors de ce parcours,
 * `null`, même si une saisine lui ouvre la collectivité. Porté ici parce que la
 * bannière en a besoin et qu'elle vit au-dessus du layout de collectivité — ce
 * store est justement ce qui remonte l'information.
 */
export type CollectiviteWithContexteInstruction =
  CollectiviteRolesAndPermissions & {
    contexteInstruction: ContexteInstruction | null;
  };

export interface CollectiviteCurrent
  extends CollectiviteWithContexteInstruction {
  nom: string;
  accesRestreint: boolean;

  isRoleAuditeur: boolean;
  isSimplifiedView: boolean;

  hasCollectivitePermission: (permission: PermissionOperation) => boolean;

  hasReferentielPermission: (
    permission: PermissionOperation,
    referentielId: ReferentielId
  ) => boolean;

  // user info also here for convenience access
  user: UserInfo;
}
