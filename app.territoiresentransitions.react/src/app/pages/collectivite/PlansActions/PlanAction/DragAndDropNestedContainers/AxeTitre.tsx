import { useEffect, useRef, useState } from 'react';
import TextareaControlled from 'ui/shared/form/TextareaControlled';
import { useEditAxe } from '../data/useEditAxe';
import classNames from 'classnames';
import { PlanNode } from '../data/types';
import { useParams } from 'next/navigation';

type Props = {
  axe: PlanNode;
  planActionId: number;
  isOpen: boolean;
  isReadonly: boolean;
};

const AxeTitre = ({ planActionId, axe, isOpen, isReadonly }: Props) => {
  const { axeUid } = useParams<{ axeUid: string }>();

  const { mutate: updatePlan } = useEditAxe(
    axeUid ? parseInt(axeUid) : planActionId
  );
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [isFocus, setIsFocus] = useState(false);

  const handleChangeTitle = () => {
    if (inputRef.current) {
      if (axe.nom) {
        inputRef.current.value !== axe.nom &&
          updatePlan({ ...axe, nom: inputRef.current.value.trim() });
      } else {
        inputRef.current.value.trim().length > 0 &&
          updatePlan({ ...axe, nom: inputRef.current.value.trim() });
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
        'grow mb-0 !px-2 text-left !text-base rounded-none !outline-none !resize-none placeholder:text-gray-900 disabled:pointer-events-none disabled:cursor-pointer disabled:text-gray-900',
        {
          'font-bold': isOpen,
          'placeholder:!text-gray-400 !outline !outline-blue-500': isFocus,
        }
      )}
      initialValue={axe.nom}
      onBlur={handleChangeTitle}
      placeholder={'Sans titre'}
      disabled={isReadonly}
    />
  );
};

export default AxeTitre;
