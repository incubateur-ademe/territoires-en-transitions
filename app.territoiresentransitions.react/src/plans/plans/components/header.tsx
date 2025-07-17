import { Spacer } from '@/ui/design-system/Spacer';
import { VisibleWhen } from '@/ui/design-system/VisibleWhen';
import { cn } from '@/ui/utils/cn';
import { PropsWithChildren } from 'react';
import { Breadcrumbs } from './breadcrumbs';

type HeaderProps = {
  title: string;
  actionButtons: React.ReactNode;
  breadcrumbs?: {
    label: string;
    href?: string;
  }[];
};

const Title = ({
  children,
  size,
}: {
  children: React.ReactNode;
  size: 'lg' | 'sm';
}) => (
  <span
    className={cn('text-primary-9 font-bold leading-snug', {
      'text-[2.5rem]': size === 'lg',
      'text-[1.5rem]': size === 'sm',
    })}
  >
    {children}
  </span>
);

export const Header = ({
  title,
  actionButtons,
  breadcrumbs,
  children,
}: PropsWithChildren<HeaderProps>) => {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between">
        <Title size="lg">{title}</Title>
        <div>{actionButtons}</div>
      </div>
      {breadcrumbs ? <Breadcrumbs size="sm" items={breadcrumbs} /> : null}
      <VisibleWhen condition={!!children}>
        <Spacer height={1} />
        {children}
      </VisibleWhen>
      <Spacer height={4} />
    </div>
  );
};
