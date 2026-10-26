import type { CollectiviteCurrent } from '@tet/api/collectivites';
import type { UserWithRolesAndPermissions } from '@tet/domain/users';
import type { HeaderProps } from '@tet/ui';

export type MakeMainNavArgs = {
  user: UserWithRolesAndPermissions;
  currentCollectivite: CollectiviteCurrent | null;
  isDemarchePcaetEnabled: boolean;
  isPriorisationEnabled: boolean;
  /** Membre de la DGEC : ouvre la configuration des référents PCAET. */
  canReadReferentsPcaet?: boolean;
};

export type MakeMainNav = (args: MakeMainNavArgs) => HeaderProps['mainNav'];
