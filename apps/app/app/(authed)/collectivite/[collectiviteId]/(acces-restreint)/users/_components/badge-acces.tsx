import { PermissionLevel } from '@/domain/users';
import { Badge, BadgeProps, IconValue } from '@/ui';
import classNames from 'classnames';

import { getPermissionLevelLabel } from '@/app/users/authorizations/permission-level.utils';

const niveauAccesToIcon: Record<PermissionLevel, IconValue> = {
  admin: 'user-star-line',
  edition: 'edit-line',
  edition_fiches_indicateurs: 'edit-line',
  lecture: 'eye-line',
};

type BadgeAccesProps = Omit<
  BadgeProps,
  'title' | 'icon' | 'iconPosition' | 'state' | 'uppercase' | 'className'
> & {
  acces?: PermissionLevel;
  className?: string;
};

const BadgeAcces = ({ acces, className, ...props }: BadgeAccesProps) => {
  if (!acces) return null;

  return (
    <Badge
      title={getPermissionLevelLabel(acces)}
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
