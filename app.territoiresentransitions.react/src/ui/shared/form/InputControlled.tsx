import {
  ForwardedRef,
  InputHTMLAttributes,
  forwardRef,
  useEffect,
  useState,
} from 'react';

type Props<T> = {
  initialValue?: string | null;
} & InputHTMLAttributes<T>;

/** Composant générique input avec un state interne pour avoir une valeur initiale */
const InputControlled = forwardRef(
  <T extends HTMLInputElement>(
    {initialValue, ...props}: Props<T>,
    ref: ForwardedRef<HTMLInputElement> | null
  ) => {
    const [value, setValue] = useState('');

    useEffect(() => {
      setValue(initialValue ?? '');
    }, [initialValue]);

    return (
      <input
        type="text"
        ref={ref}
        value={value}
        onChange={e => setValue(e.target.value)}
        {...props}
      />
    );
  }
);

export default InputControlled;
