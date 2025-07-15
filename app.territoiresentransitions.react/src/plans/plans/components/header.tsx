import { cn } from '@/ui/utils/cn';
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

export const Header = ({ title, actionButtons, breadcrumbs }: HeaderProps) => {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between">
        <Title size="lg">{title}</Title>
        <div>{actionButtons}</div>
      </div>
      {breadcrumbs ? <Breadcrumbs size="sm" items={breadcrumbs} /> : null}
    </div>
  );
};
