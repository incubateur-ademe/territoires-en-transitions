'use client';
import { cn } from '@/ui/utils/cn';
import NextLink from 'next/link';

type LinkWithIcon = {
  dataTest?: string;
  url: string;
  icon: React.JSX.Element;
  title: string;
  subTitle: string;
  variant?: 'primary';
  onClickCallback?: () => void;
};

export const Link = ({
  dataTest,
  url,
  icon,
  title,
  subTitle,
  variant,
  onClickCallback,
}: LinkWithIcon) => {
  const isPrimary = variant === 'primary';
  return (
    <div
      className={cn(
        'grow bg-white border border-gray-200 rounded-md hover:bg-primary-0',
        { 'bg-primary hover:bg-primary-6': isPrimary }
      )}
    >
      <NextLink
        data-test={dataTest}
        className="flex flex-col w-full py-6 items-center text-center text-sm !bg-none"
        href={url}
        onClick={() => {
          onClickCallback?.();
        }}
      >
        {icon}
        <div
          className={cn('m-1 font-bold text-primary-8', {
            'text-primary-0': isPrimary,
          })}
        >
          {title}
        </div>
        <div
          className={cn('text-grey-7 text-xs', {
            'text-grey-1': variant,
          })}
        >
          {subTitle}
        </div>
      </NextLink>
    </div>
  );
};
