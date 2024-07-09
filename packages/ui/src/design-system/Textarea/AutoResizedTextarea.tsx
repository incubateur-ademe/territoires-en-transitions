import {Ref, RefObject, forwardRef, useEffect, useState} from 'react';
import {useAutoResize} from './useAutoResize';
import {Textarea, TextareaProps} from './Textarea';

export const AutoResizedTextarea = forwardRef(
  (props: TextareaProps, ref?: Ref<HTMLTextAreaElement>) => {
    // Valeur locale, nécessaire pour le refresh des valeurs textareaRef et shadowRef
    const [value, setValue] = useState<string | undefined>(props.value);

    useEffect(() => setValue(value), [props.value]);

    const {textareaRef, shadowRef} = useAutoResize(
      value?.toString(),
      ref as RefObject<HTMLTextAreaElement>
    );

    const handleChange = evt => {
      props.onChange?.(evt.target.value);
      setValue(evt.target.value);
    };

    return (
      <div className="flex items-start w-full">
        <div ref={shadowRef} className="w-px -mr-px" />
        <Textarea ref={textareaRef} onChange={handleChange} resize="none" />
      </div>
    );
  }
);
