import TextareaControlled from '@/app/ui/shared/form/TextareaControlled';
import classNames from 'classnames';
import { useEffect, useRef, useState } from 'react';
import { PlanNode } from '../data/types';

type Props = {
  axe: PlanNode;
  planActionId: number;
  isOpen: boolean;
  isReadonly: boolean;
  onEdit: (nom: string) => void;
  fontColor: string;
};

export const AxeTitre = ({
  axe,
  isOpen,
  isReadonly,
  onEdit,
  fontColor,
}: Props) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [isFocus, setIsFocus] = useState(false);

  const handleChangeTitle = () => {
    if (inputRef.current) {
      if (axe.nom) {
        inputRef.current.value !== axe.nom &&
          onEdit(inputRef.current.value.trim());
      } else {
        inputRef.current.value.trim().length > 0 &&
          onEdit(inputRef.current.value.trim());
      }
    }
  };

  const handleSetFocus = () => {
    if (document.activeElement === inputRef.current) {
      setIsFocus(true);
    } else {
      setIsFocus(false);
    }
  };

  const handleEnterKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    document.addEventListener('focusin', handleSetFocus);
    document.addEventListener('focusout', handleSetFocus);
    inputRef.current?.addEventListener('keydown', handleEnterKeydown);

    return () => {
      document.removeEventListener('focusin', handleSetFocus);
      document.removeEventListener('focusout', handleSetFocus);
      inputRef.current?.removeEventListener('keydown', handleEnterKeydown);
    };
  }, []);

  return (
    <TextareaControlled
      data-test="TitreAxeInput"
      ref={inputRef}
      id={`axe-titre-${axe.id.toString()}`}
      className={classNames(
        'grow mb-0 px-2 text-left text-sm font-bold text-primary-8 rounded-none outline-none resize-none placeholder:text-gray-900 disabled:pointer-events-none disabled:cursor-pointer disabled:text-gray-900',
        fontColor,
        {
          'font-bold': isOpen,
          'placeholder:text-gray-400 outline outline-blue-500': isFocus,
        }
      )}
      initialValue={axe.nom}
      onBlur={handleChangeTitle}
      placeholder={'Sans titre'}
      disabled={isReadonly}
    />
  );
};
