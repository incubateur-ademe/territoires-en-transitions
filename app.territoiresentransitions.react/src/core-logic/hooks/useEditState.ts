import {useState} from 'react';

type TEditStateArgs = {
  initialValue: string | null | undefined;
  onUpdate: (newValue: string) => unknown;
};

export type TEditState = ReturnType<typeof useEditState>;

/** fourni un gestionnaire d'état pour entrer/sortir du mode "édition" */
export const useEditState = ({initialValue, onUpdate}: TEditStateArgs) => {
  const [isEditing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue || '');

  const enter = () => setEditing(true);
  const exit = () => {
    setEditing(false);
    if (value !== initialValue) onUpdate(value);
  };

  return {
    isEditing,
    enter,
    exit,
    value,
    setValue, // modifier la valeur
  };
};

/** fourni une variante de `useEditState` permettant d'empêcher le changement
 * d'extension lorsqu'on renomme un fichier */
export const useEditFilenameState = ({
  initialValue,
  onUpdate,
}: TEditStateArgs) => {
  const parts = initialValue?.split('.');
  const ext = parts?.pop() || '';
  const name = parts?.join('.');
  const onUpdateFilename: TEditStateArgs['onUpdate'] = newValue =>
    onUpdate(newValue + (ext ? `.${ext}` : ''));
  return useEditState({initialValue: name, onUpdate: onUpdateFilename});
};
