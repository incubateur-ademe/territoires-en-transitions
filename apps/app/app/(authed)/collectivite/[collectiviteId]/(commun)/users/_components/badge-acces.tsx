import { CollectiviteRole } from '@tet/domain/users';
import { Badge, BadgeProps, IconValue } from '@tet/ui';

import { getCollectiviteRoleLabel } from '@/app/users/authorizations/collectivite-role.utils';

const niveauAccesToIcon: Record<CollectiviteRole, IconValue> = {
  admin: 'user-star-line',
  edition: 'edit-line',
  edition_fiches_indicateurs: 'edit-line',
  lecture: 'eye-line',
};

type BadgeAccesProps = Omit<
  BadgeProps,
  'title' | 'icon' | 'iconPosition' | 'state' | 'uppercase'
> & {
  acces?: CollectiviteRole;
};

const BadgeAcces = ({ acces, ...props }: BadgeAccesProps) => {
  if (!acces) return null;

  return (
    <Badge
      title={getCollectiviteRoleLabel(acces)}
      icon={niveauAccesToIcon[acces]}
      iconPosition="left"
      variant={acces === 'lecture' ? 'default' : 'high'}
      type="outlined"
      uppercase={false}
      {...props}
    />
  );
};

export default BadgeAcces;
