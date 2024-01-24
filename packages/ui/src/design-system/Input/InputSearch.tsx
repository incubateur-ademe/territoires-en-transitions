import {useRef} from 'react';
import {InputBase, InputBaseProps} from './InputBase';

export type InputSearchProps = Omit<InputBaseProps, 'icon' | 'type'> & {
  onSearch: (value: string) => void;
};

/**
 * Affiche un champ de recherche.
 * Un bouton permet de déclencher la recherche. Le bouton est désactivé si le champ est vide.
 */
export const InputSearch = ({
  onSearch,
  ...remainingProps
}: InputSearchProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const disabled = !(remainingProps.value || inputRef.current?.value);

  return (
    <InputBase
      type="search"
      ref={inputRef}
      icon={{
        buttonProps: {
          icon: 'search-line',
          disabled,
          onClick: () => onSearch(inputRef.current.value),
          title: 'Rechercher',
        },
      }}
      {...remainingProps}
    />
  );
};
