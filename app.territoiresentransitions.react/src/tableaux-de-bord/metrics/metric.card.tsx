import { Button, ButtonProps } from '@/ui';
import classNames from 'classnames';
import React from 'react';

type Props = {
  title: string;
  count?: number;
  countLabel?: string;
  link?: ButtonProps;
  additionalContent?: React.ReactNode;
  className?: string;
};

export const MetricCard = ({
  title,
  count = 0,
  countLabel,
  link,
  additionalContent,
  className,
}: Props) => {
  return (
    <div
      className={classNames(
        'flex flex-col p-6 bg-white border border-grey-3 rounded-xl',
        className
      )}
    >
      <div className="flex items-baseline gap-1">
        <span className="text-6xl leading-none font-bold text-primary-9">
          {count}
        </span>
        {countLabel && (
          <span className="ml-1 text-sm text-grey-7">{countLabel}</span>
        )}
      </div>
      <p className="mb-2 mt-1 font-bold text-primary-8">{title}</p>
      {link && (
        <Button
          {...link}
          variant="underlined"
          size="xs"
          className={classNames('mt-auto text-left', link.className)}
        />
      )}
      {additionalContent}
    </div>
  );
};
