import { useAutoSizeTextarea } from '@/app/ui/shared/form/useAutoSizeTextarea';
import { cn } from '@tet/ui/utils/cn';
import React, {
  ForwardedRef,
  forwardRef,
  RefObject,
  TextareaHTMLAttributes,
} from 'react';

export type TTextarea<T> = {
  // ref?: RefObject<HTMLTextAreaElement>;
  onInputChange?: (value: string) => void;
  /** Minimum height pour le textarea. Valeur défaut "2.25rem" */
  minHeight?: string;
} & TextareaHTMLAttributes<T>;

/** Composant générique Textarea avec auto-resize */
// Resize inspiré du post : https://css-tricks.com/the-cleanest-trick-for-autogrowing-textareas/#comment-1794830
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
      onInputChange?.(event.target.value);
    };

    const { textareaRef, shadowRef } = useAutoSizeTextarea(
      value?.toString(),
      ref as RefObject<HTMLTextAreaElement>
    );

    return (
      <div className="flex items-start w-full">
        <div ref={shadowRef} className="w-[1px] mr-[-1px]" />
        <textarea
          ref={textareaRef}
          className={cn(
            `resize-none w-full py-2 px-3 text-sm cursor-text outline outline-offset-0 outline-1 outline-gray-300 focus:outline-blue-500 disabled:text-gray-900`,
            className
          )}
          onChange={textareaChange}
          value={value}
          placeholder={placeholder}
          style={{ minHeight }}
          {...props}
        />
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
