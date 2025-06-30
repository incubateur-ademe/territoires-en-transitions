'use client';
import classNames from 'classnames';
import NextLink from 'next/link';

type LinkWithIcon = {
  dataTest?: string;
  url: string;
  icon: React.JSX.Element;
  title: string;
  subTitle: string;
  isPrimary?: boolean;
  onClickCallback?: () => void;
};

export const Link = ({
  dataTest,
  url,
  icon,
  title,
  subTitle,
  isPrimary = false,
  onClickCallback,
}: LinkWithIcon) => {
  return (
    <div
      className={classNames(
        'grow bg-white border border-gray-200 rounded-lg hover:bg-primary-0',
        { '!bg-primary hover:!bg-primary-6': isPrimary }
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
          className={classNames('m-1 font-bold text-primary-8', {
            '!text-primary-0': isPrimary,
          })}
        >
          {title}
        </div>
        <div
          className={classNames('text-grey-7 text-xs', {
            '!text-grey-1': isPrimary,
          })}
        >
          {subTitle}
        </div>
      </NextLink>
    </div>
  );
};
