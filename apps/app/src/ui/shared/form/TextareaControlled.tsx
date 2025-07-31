import { ForwardedRef, forwardRef, useEffect, useState } from 'react';

import Textarea, { TTextarea } from './Textarea';

type Props<T> = {
  initialValue?: string | null;
} & TTextarea<T>;

/** Composant générique Textarea avec un state interne pour avoir une valeur initiale */
const TextareaControlled = forwardRef(
  <T extends HTMLTextAreaElement>(
    { initialValue, ...props }: Props<T>,
    ref: ForwardedRef<HTMLTextAreaElement> | null
  ) => {
    const [value, setValue] = useState('');

    useEffect(() => {
      setValue(initialValue ?? '');
    }, [initialValue]);

    return (
      <Textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        {...props}
      />
    );
  }
);

TextareaControlled.displayName = 'TextareaControlled';

export default TextareaControlled;
