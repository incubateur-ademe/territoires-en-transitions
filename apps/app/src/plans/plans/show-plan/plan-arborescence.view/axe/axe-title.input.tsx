import { appLabels } from '@/app/labels/catalog';
import { cn } from '@tet/ui/utils/cn';
import { useEffect, useRef, useState } from 'react';
import { useAxeContext } from './axe.context';

type Props = {
  fontColor: string;
};

export const AxeTitleInput = ({ fontColor }: Props) => {
  const { updateAxe, setIsOpenEditTitle, providerProps } = useAxeContext();
  const { axe } = providerProps;

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(axe.nom ?? '');

  // donne le focus quand le champ devient éditable
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      // sélectionne la valeur courante
      inputRef.current.selectionStart = 0;
      inputRef.current.selectionEnd = inputRef.current.value.length;
    }
  }, []);

  // termine l'édition et sauvegarde les changements
  const save = () => {
    setIsOpenEditTitle(false);
    const nom = value.trim();
    if (nom !== axe.nom) {
      updateAxe.mutate({ nom });
    }
  };

  return (
    <textarea
      data-test="TitreAxeInput"
      ref={inputRef}
      id={`axe-titre-${axe.id.toString()}`}
      className={cn(
        'grow resize-none border-none bg-transparent text-left text-lg font-bold content-center placeholder:text-lg focus:placeholder:text-grey-4 leading-5',
        fontColor
      )}
      value={value}
      onChange={(e) => setValue(e.currentTarget.value)}
      onBlur={save}
      onKeyDown={(e) => {
        // déclenche la fin de l'édition
        if (e.code === 'Escape') {
          e.preventDefault();
          setIsOpenEditTitle(false);
          return;
        }
        if (['Enter', 'NumpadEnter'].includes(e.code)) {
          e.preventDefault();
          save();
        }
      }}
      placeholder={appLabels.sansTitre}
    />
  );
};
