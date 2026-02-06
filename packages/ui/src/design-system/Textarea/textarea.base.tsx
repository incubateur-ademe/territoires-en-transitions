import {
  ComponentPropsWithRef,
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { cn } from '../../utils/cn';

export type TextareaBaseProps = ComponentPropsWithRef<'textarea'> & {
  autoresize?: boolean;
  onEnterKeyDown?: () => void;
};

export const TextareaBase = forwardRef(
  (
    { autoresize = true, onEnterKeyDown, ...props }: TextareaBaseProps,
    ref?: React.Ref<HTMLTextAreaElement | null>
  ) => {
    const [localValue, setLocalValue] = useState(props.value);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (props.onChange) {
        props.onChange(e);
      }
      setLocalValue(e.target.value);
    };

    const localRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => localRef.current as HTMLTextAreaElement);

    /** Autoresize - Adjust the height of the textarea to fit its content */
    useLayoutEffect(() => {
      if (autoresize && localRef.current) {
        localRef.current.style.height = 'auto';
        localRef.current.style.height = `${localRef.current.scrollHeight}px`;
      }
    }, [localValue, autoresize]);

    /** Ensure focus at the end of the content */
    useLayoutEffect(() => {
      if (props.autoFocus && localRef.current) {
        const length = localRef.current.value.length;
        localRef.current.focus();
        localRef.current.setSelectionRange(length, length);
      }
    }, [props.autoFocus]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!!onEnterKeyDown && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onEnterKeyDown?.();
      }

      props.onKeyDown?.(e);
    };

    return (
      <textarea
        {...props}
        ref={localRef}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={cn(
          'outline-none',
          { 'resize-none': autoresize },
          props.className
        )}
      />
    );
  }
);
TextareaBase.displayName = 'TextareaBase';