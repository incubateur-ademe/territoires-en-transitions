import { cn } from '@tet/ui/utils/cn';
import { useEffect, useRef, useState } from 'react';
import { useAxeContext } from './axe.context';

type Props = {
  fontColor: string;
};

export const AxeTitleInput = ({ fontColor }: Props) => {
  const {
    updateAxe,
    isReadOnly,
    isOpenEditTitle,
    setIsOpenEditTitle,
    providerProps,
  } = useAxeContext();
  const { axe } = providerProps;
  const disabled = isReadOnly || !isOpenEditTitle;

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(axe.nom);

  // donne le focus quand le champ devient éditable
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
      // et sélectionne la valeur courant
      inputRef.current.selectionStart = 0;
      inputRef.current.selectionEnd = inputRef.current.value.length;
    }
  }, [disabled]);

  return (
    <textarea
      data-test="TitreAxeInput"
      ref={inputRef}
      id={`axe-titre-${axe.id.toString()}`}
      className={cn(
        'grow resize-none border-none bg-transparent text-left text-lg font-bold content-center placeholder:text-lg focus:placeholder:text-grey-4 leading-5',
        fontColor,
        {
          'pointer-events-none cursor-pointer select-none': disabled,
          italic: disabled && !axe.nom,
        }
      )}
      value={disabled ? axe.nom || 'Sans titre' : value || ''}
      onChange={(e) => setValue(e.currentTarget.value)}
      onBlur={(e) => {
        setIsOpenEditTitle(false);
        const nom = e.currentTarget.value.trim();
        if (nom !== axe.nom) {
          updateAxe.mutateAsync({ nom });
        }
      }}
      onKeyDown={(e) => {
        if (e.code === 'Enter' || e.code === 'Escape') {
          e.currentTarget.blur();
        }
      }}
      placeholder={disabled ? '' : 'Sans titre'}
      disabled={disabled}
    />
  );
};
