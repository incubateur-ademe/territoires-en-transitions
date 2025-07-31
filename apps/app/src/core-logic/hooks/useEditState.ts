import {useState} from 'react';

type TEditStateArgs = {
  initialValue: string | null | undefined;
  onUpdate: (newValue: string) => unknown;
};

export type TEditState = {
  /** indique si on est en mode édition */
  isEditing: boolean;
  /** entre en mode édition */
  enter: () => void;
  /** sort du mode édition */
  exit: () => void;
  /** valeur courante du champ */
  value: string;
  /** met à jour la valeur courante du champ */
  setValue: (value: string) => void;
};

/** fourni un gestionnaire d'état pour entrer/sortir du mode "édition" lors par
 * exemple d'un clic sur un bouton faisant apparaitre un champ de saisie, qui
 * lui-même disparait lors de l'appui sur la touche "enter" */
export const useEditState = ({initialValue, onUpdate}: TEditStateArgs) => {
  const [isEditing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue || '');

  const enter = () => setEditing(true);
  const exit = () => {
    if (isEditing) {
      setEditing(false);
      if (value !== initialValue) onUpdate(value);
    }
  };

  return {
    isEditing,
    enter,
    exit,
    value,
    setValue,
  };
};

/** fourni une variante de `useEditState` permettant d'empêcher le changement
 * d'extension lorsqu'on renomme un fichier */
export const useEditFilenameState = ({
  initialValue,
  onUpdate,
}: TEditStateArgs) => {
  // sépare l'extension et le nom de fichier
  const parts = initialValue?.split('.');
  const ext = parts && parts.length > 1 ? parts.pop() : '';
  const name = parts?.join('.');

  // rajoute l'extension à la fin de l'édition du nom avant d'appeler la fonction d'update
  const onUpdateFilename: TEditStateArgs['onUpdate'] = newValue =>
    onUpdate(newValue + (ext ? `.${ext}` : ''));

  // passe le nom de fichier (sans extension) comme valeur initiale
  // et la fonction d'update qui rajoute l'extension à la fin de l'édition
  return useEditState({initialValue: name, onUpdate: onUpdateFilename});
};
