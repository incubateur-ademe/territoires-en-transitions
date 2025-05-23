import { TNiveauAcces } from '@/app/types/alias';
import { Badge, BadgeProps, IconValue } from '@/ui';
import classNames from 'classnames';

const niveauAccesToLabel: Record<TNiveauAcces, string> = {
  admin: 'Admin',
  edition: 'Édition',
  lecture: 'Lecture',
};

const niveauAccesToIcon: Record<TNiveauAcces, IconValue> = {
  admin: 'user-star-line',
  edition: 'edit-line',
  lecture: 'eye-line',
};

type BadgeAccesProps = Omit<
  BadgeProps,
  'title' | 'icon' | 'iconPosition' | 'state' | 'uppercase' | 'className'
> & {
  acces?: TNiveauAcces;
  className?: string;
};

const BadgeAcces = ({ acces, className, ...props }: BadgeAccesProps) => {
  if (!acces) return null;

  return (
    <Badge
      title={niveauAccesToLabel[acces]}
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
