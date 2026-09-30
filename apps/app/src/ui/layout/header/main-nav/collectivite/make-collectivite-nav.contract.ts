import type { CollectiviteCurrent } from '@tet/api/collectivites';
import type { ReferentielDisplayMap } from '@tet/domain/collectivites';
import type { UserWithRolesAndPermissions } from '@tet/domain/users';
import type { HeaderProps, NavDropdown, NavLink } from '@tet/ui';

type AddtionalProps = {
  isVisible?: boolean;
};

export type CollectiviteNavLink = NavLink & AddtionalProps;

type CollectiviteNavDropdown = NavDropdown &
  AddtionalProps & {
    links: CollectiviteNavLink[];
  };

export type CollectiviteNavItem = CollectiviteNavLink | CollectiviteNavDropdown;

export type MakeCollectiviteNavArgs = {
  user: UserWithRolesAndPermissions;
  currentCollectivite: CollectiviteCurrent;
  referentielDisplay?: ReferentielDisplayMap;
  isDemarchePcaetEnabled: boolean;
};

export type MakeCollectiviteNav = (
  args: MakeCollectiviteNavArgs
) => HeaderProps['mainNav'];
