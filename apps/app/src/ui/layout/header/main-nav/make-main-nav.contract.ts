import type { CollectiviteCurrent } from '@tet/api/collectivites';
import type { ReferentielDisplayMap } from '@tet/domain/collectivites';
import type { UserWithRolesAndPermissions } from '@tet/domain/users';
import type { HeaderProps } from '@tet/ui';

export type MakeMainNavArgs = {
  user: UserWithRolesAndPermissions;
  currentCollectivite: CollectiviteCurrent | null;
  referentielDisplay?: ReferentielDisplayMap;
  isDemarchePcaetEnabled: boolean;
};

export type MakeMainNav = (args: MakeMainNavArgs) => HeaderProps['mainNav'];
