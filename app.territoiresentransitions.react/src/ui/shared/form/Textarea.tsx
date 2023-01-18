import classNames from 'classnames';
import React, {
  ForwardedRef,
  forwardRef,
  RefObject,
  TextareaHTMLAttributes,
} from 'react';
import {useAutoSizeTextarea} from 'ui/shared/form/useAutoSizeTextarea';

export type TTextarea<T> = {
  // ref?: RefObject<HTMLTextAreaElement>;
  onInputChange?: (value: string) => void;
  /** Minimum height pour le textarea. Valeur défaut "2.25rem" */
  minHeight?: string;
} & TextareaHTMLAttributes<T>;

/** Composant générique Textarea avec auto-resize */
const Textarea = forwardRef(
  <T extends HTMLTextAreaElement>(
    {
      value,
      onInputChange,
      placeholder,
      className,
      minHeight = '2.25rem',
      ...props
    }: TTextarea<T>,
    ref: ForwardedRef<HTMLTextAreaElement> | null
  ) => {
    // Appelée au changement de valeur du textarea
    const textareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      onInputChange && onInputChange(event.target.value);
    };

    const textareaRef = useAutoSizeTextarea(
      value?.toString(),
      minHeight,
      ref as RefObject<HTMLTextAreaElement>
    );

    return (
      <textarea
        ref={textareaRef}
        className={classNames(
          `w-full py-2 px-3 text-sm cursor-text rounded-lg outline outline-offset-0 !outline-1 outline-gray-300 focus:outline-blue-500 ${className}`
        )}
        onChange={textareaChange}
        value={value}
        placeholder={placeholder}
        {...props}
      />
    );
  }
);

export default Textarea;
