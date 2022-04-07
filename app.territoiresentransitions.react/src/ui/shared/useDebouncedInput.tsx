import {ChangeEvent, useState} from 'react';

/** Gère l'appel différé à un callback lors de la saisie dans un champ */
export const useDebouncedInput: TDebouncedInputHook = (
  initialValue,
  callback,
  debouncePeriod = 1000
) => {
  const [query, setQuery] = useState(initialValue);
  const [timeoutId, setTimeoutId] = useState<number | undefined>();

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    // récupère la nouvelle valeur du champ
    const {value} = event.target;
    // supprime l'ancien timer si il existait
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(undefined);
    }
    // puis ajoute un nouveau timer pour appeler en différé le callback
    // (si il n'y a pas de nouveaux changements de la valeur d'ici là)
    setTimeoutId(setTimeout(callback, debouncePeriod, value));
    // met à jour l'état interne avec la nouvelle valeur
    setQuery(value);
  };

  // renvoie la valeur courante et les handlers associés
  return [query, onChange, setQuery];
};

type TDebouncedInputHook = (
  /** Valeur initiale du champ de saisie */
  initialValue: string,
  /** Fonction appelé après la dernière touche enfoncée dans le délai donné */
  callback: (query: string) => void,
  /** Délai avant appel du callback */
  debouncePeriod?: number
) => [
  /** Valeur courante du champ de saisie */
  query: string,
  /** Gestionnaire d'événements à raccorder au champ de saisie */
  onChange: (event: ChangeEvent<HTMLInputElement>) => void,
  /** Permet de mettre à jour la valeur courante */
  setQuery: (value: string) => void
];
