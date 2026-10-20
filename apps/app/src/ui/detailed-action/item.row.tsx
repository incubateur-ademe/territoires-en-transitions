import { appLabels } from '@/app/labels/catalog';
import { cn, Icon, VisibleWhen } from '@tet/ui';
import type { JSX, ReactNode } from 'react';

const ItemIcon = ({
  icon,
  small,
}: {
  readonly icon: string | ReactNode;
  readonly small?: boolean;
}): JSX.Element => (
  <div
    className={cn(
      'bg-primary-1 rounded-full self-start flex items-center justify-center flex-none text-primary-9',
      {
        'w-12 h-12': !small,
        'w-8 h-8': small,
      }
    )}
  >
    {typeof icon === 'string' ? <Icon icon={icon} aria-hidden /> : icon}
  </div>
);

const ItemLabel = ({ label }: { readonly label: string }): JSX.Element => (
  <div className="text-primary-10 text-base flex items-center gap-1">
    {appLabels.labelDeuxPoints({ label })}{' '}
  </div>
);

const Item = ({
  small,
  icon,
  label,
  children,
}: {
  readonly small?: boolean;
  readonly icon?: string | ReactNode;
  readonly label?: string | ReactNode;
  readonly children: ReactNode;
}): JSX.Element => {
  const hasTextLabel = typeof label === 'string' && label !== '';
  return (
    <div className="text-sm leading-6 font-regular gap-4 mb-1 flex items-start">
      <VisibleWhen condition={!!icon}>
        <ItemIcon icon={icon} small={small} />
      </VisibleWhen>
      <div
        className={cn('flex flex-col self-stretch', {
          'justify-center': !hasTextLabel,
        })}
      >
        {hasTextLabel ? <ItemLabel label={label} /> : label}
        {children}
      </div>
    </div>
  );
};

export { Item };
