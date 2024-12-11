import {
  ChangeEvent,
  Ref,
  RefObject,
  forwardRef,
  useEffect,
  useState,
} from 'react';
import { Textarea, TextareaProps } from './Textarea';
import { useAutoResize } from './useAutoResize';

export const AutoResizedTextarea = forwardRef(
  (props: TextareaProps, ref?: Ref<HTMLTextAreaElement>) => {
    const { onChange, value: initialValue, ...restProps } = props;

    // Valeur locale, nécessaire pour le refresh des valeurs textareaRef et shadowRef
    const [value, setValue] = useState<string | undefined>(initialValue);

    useEffect(() => setValue(initialValue), [initialValue]);

    const { textareaRef, shadowRef } = useAutoResize(
      value?.toString(),
      ref as RefObject<HTMLTextAreaElement>
    );

    const handleChange = (evt: ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(evt);
      setValue(evt.target.value);
    };

    return (
      <div className="flex items-start w-full">
        <div ref={shadowRef} className="w-px -mr-px" />
        <Textarea
          {...restProps}
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          resize="none"
        />
      </div>
    );
  }
);
