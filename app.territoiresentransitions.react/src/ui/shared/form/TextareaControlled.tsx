import {useState} from 'react';

import Textarea, {TTextarea} from './Textarea';

type Props<T> = {
  initialValue?: string;
} & TTextarea<T>;

/** Composant générique Textarea avec un state interne pour avoir une valeur initiale */
const TextareaControlled = <T extends HTMLTextAreaElement>({
  initialValue,
  ...props
}: Props<T>) => {
  const [value, setValue] = useState(initialValue);
  return (
    <Textarea
      value={value}
      onChange={e => setValue(e.target.value)}
      {...props}
    />
  );
};

export default TextareaControlled;
