'use client';
import { Breadcrumbs } from '@/ui';
import { cn } from '@/ui/utils/cn';
import { PropsWithChildren } from 'react';

type HeaderProps = {
  title: string;
  actionButtons: React.ReactNode;
  breadcrumbs?: {
    label: string;
    href?: string;
  }[];
};

const Title = ({ children }: { children: React.ReactNode }) => (
  <h2 className={cn('text-primary-9 font-bold mb-0 leading-snug')}>
    {children}
  </h2>
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
        <Title>{title}</Title>
        <div>{actionButtons}</div>
      </div>
      {breadcrumbs ? <Breadcrumbs size="sm" items={breadcrumbs} /> : null}
      {children}
    </div>
  );
};
