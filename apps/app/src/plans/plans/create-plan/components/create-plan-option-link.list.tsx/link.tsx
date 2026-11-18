'use client';
import { cn } from '@tet/ui/utils/cn';
import NextLink from 'next/link';

type LinkWithIcon = {
  dataTest?: string;
  url: string;
  icon: React.JSX.Element;
  title: React.ReactNode;
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
        'h-full grow rounded-lg border border-grey-3 bg-white transition-colors hover:bg-primary-0',
        { 'bg-primary hover:bg-primary-6': isPrimary }
      )}
    >
      <NextLink
        data-test={dataTest}
        className="flex h-full min-h-[182px] w-full flex-col items-center justify-center gap-2 px-6 py-6 text-center text-sm !bg-none"
        href={url}
        onClick={() => {
          onClickCallback?.();
        }}
      >
        <div className="flex h-16 items-center justify-center">{icon}</div>
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
