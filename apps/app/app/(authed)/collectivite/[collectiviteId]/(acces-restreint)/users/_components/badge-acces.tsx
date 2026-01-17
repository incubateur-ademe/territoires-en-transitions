import { CollectiviteRole } from '@tet/domain/users';
import { Badge, BadgeProps, IconValue } from '@tet/ui';
import classNames from 'classnames';

import { getAccessLevelLabel } from '@/app/users/authorizations/permission-access-level.utils';

const niveauAccesToIcon: Record<CollectiviteRole, IconValue> = {
  admin: 'user-star-line',
  edition: 'edit-line',
  edition_fiches_indicateurs: 'edit-line',
  lecture: 'eye-line',
};

type BadgeAccesProps = Omit<
  BadgeProps,
  'title' | 'icon' | 'iconPosition' | 'state' | 'uppercase' | 'className'
> & {
  acces?: CollectiviteRole;
  className?: string;
};

const BadgeAcces = ({ acces, className, ...props }: BadgeAccesProps) => {
  if (!acces) return null;

  return (
    <Badge
      title={getAccessLevelLabel(acces)}
      icon={niveauAccesToIcon[acces]}
      iconPosition="left"
      state={acces === 'lecture' ? 'default' : 'custom'}
      uppercase={false}
      className={classNames(
        {
          'text-primary-9 bg-grey-1 border-primary-4': acces !== 'lecture',
        },
        className
      )}
      {...props}
    />
  );
};

export default BadgeAcces;
