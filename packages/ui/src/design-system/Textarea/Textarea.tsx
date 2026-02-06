import classNames from 'classnames';

import { forwardRef } from 'react';
import { TextareaBase, TextareaBaseProps } from './textarea.base';

export type TextareaProps = TextareaBaseProps & {
  size?: 'xs' | 'sm' | 'md';
  disabled?: boolean;
  dataTest?: string;
};

export const Textarea = forwardRef(
  (
    {
      size = 'sm',
      disabled = false,
      className,
      dataTest,
      ...props
    }: TextareaProps,
    ref: React.Ref<HTMLTextAreaElement>
  ) => {
    return (
      <TextareaBase
        {...props}
        ref={ref}
        data-test={dataTest}
        disabled={disabled}
        className={classNames(
          'w-full p-4 text-grey-8 border border-solid rounded-lg bg-grey-1 border-grey-4 overflow-hidden focus-within:border-primary-5',
          {
            'border-grey-3': disabled,
            'text-xs placeholder:text-xs py-2': size === 'xs',
            'text-sm placeholder:text-sm py-3': size === 'sm',
          },
          className
        )}
      />
    );
  }
);
Textarea.displayName = 'Textarea';