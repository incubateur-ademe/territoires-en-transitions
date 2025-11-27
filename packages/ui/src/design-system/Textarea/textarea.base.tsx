import { ComponentPropsWithRef, useLayoutEffect, useRef } from 'react';

import { cn } from '@/ui/utils/cn';

export type TextareaBaseProps = ComponentPropsWithRef<'textarea'> & {
  autoresize?: boolean;
};

export const TextareaBase = ({
  autoresize = true,
  ...props
}: TextareaBaseProps) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  /** Autoresize - Adjust the height of the textarea to fit its content */
  useLayoutEffect(() => {
    if (autoresize && ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [props.value, autoresize]);

  /** Ensure focus at the end of the content */
  useLayoutEffect(() => {
    if (props.autoFocus && ref.current) {
      const length = ref.current.value.length;
      ref.current.focus();
      ref.current.setSelectionRange(length, length);
    }
  }, [props.autoFocus]);

  return (
    <textarea
      {...props}
      ref={ref}
      className={cn(
        'outline-none',
        { 'resize-none': autoresize },
        props.className
      )}
    />
  );
};
