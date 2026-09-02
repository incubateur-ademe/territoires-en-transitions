import { ContexteInstruction } from '@tet/domain/demarches';
import { ReferentielId } from '@tet/domain/referentiels';
import {
  CollectiviteRolesAndPermissions,
  PermissionOperation,
  UserInfo,
} from '@tet/domain/users';

/**
 * La collectivité courante, plus la raison pour laquelle on la consulte quand
 * ce n'est pas l'appartenance : l'agent d'un service qui l'instruit y entre par
 * la saisine. Porté ici parce que la navigation et la bannière en ont besoin, et
 * qu'elles vivent au-dessus du layout de collectivité — ce store est justement
 * ce qui remonte l'information.
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
