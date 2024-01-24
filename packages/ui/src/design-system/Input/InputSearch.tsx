import {useEffect, useRef, useState} from 'react';
import {useDebouncedCallback} from 'use-debounce';
import {InputBase, InputBaseProps} from './InputBase';

export type InputSearchProps = Omit<InputBaseProps, 'icon' | 'type'> & {
  /** Fait apparaître un picto "chargement" à la place du picto "recherche" */
  isLoading?: boolean;
  /** Valeur en ms du délai entre deux appels à `onSearch` lors de la saisie. */
  debounce?: number;
  /** Appelée pour déclencher la recherche. Reçoit la valeur saisie dans le champ. */
  onSearch: (value: string) => void;
};

/**
 * Affiche un champ de recherche.
 * Un bouton permet de déclencher la recherche. Le bouton est désactivé si le champ est vide.
 * La recherche se déclenche également automatiquement (avec un `debounce`) lors de la saisie
 */
export const InputSearch = ({
  isLoading = false,
  debounce = 500,
  onChange,
  onSearch,
  ...remainingProps
}: InputSearchProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const disabled = !(remainingProps.value || inputRef.current?.value);

  /**
   * Permet de profiter du debounce de l'input et d'afficher un text de chargement
   * quand l'utilisateur est entrain de faire une saisie.
   */
  const [loading, setLoading] = useState(isLoading);
  // synchronise l'état de loading interne avec l'externe
  useEffect(() => setLoading(isLoading), [isLoading]);

  /** Debounce les appels à `onSearch` */
  const handleDebouncedInputChange = useDebouncedCallback(v => {
    setLoading(true);
    onSearch(v);
  }, debounce);

  return (
    <InputBase
      type="search"
      ref={inputRef}
      onChange={e => {
        onChange?.(e);
        const value = e.target.value;
        if (value) {
          handleDebouncedInputChange(value);
        } else {
          setLoading(false);
        }
      }}
      icon={{
        buttonProps: {
          disabled,
          icon: loading ? 'loader-4-line animate-spin' : 'search-line',
          onClick: () => handleDebouncedInputChange(inputRef.current.value),
          title: 'Rechercher',
        },
      }}
      {...remainingProps}
    />
  );
};
