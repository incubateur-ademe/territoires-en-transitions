import {useEffect, useRef, useState} from 'react';
import classNames from 'classnames';

import {AxeActions} from './AxeActions';

import {PlanNode} from './data/types';
import {useEditAxe} from './data/useEditAxe';
import TextareaControlled from 'ui/shared/form/TextareaControlled';
import SupprimerAxeModal from './SupprimerAxeModal';
import PlanActionAxeFiches from './PlanActionAxeFiches';

type Props = {
  planActionGlobal: PlanNode;
  axe: PlanNode;
  displayAxe: (axe: PlanNode) => void;
  isReadonly: boolean;
};

const PlanActionAxe = ({
  planActionGlobal,
  axe,
  displayAxe,
  isReadonly,
}: Props) => {
  const {mutate: updatePlan} = useEditAxe(planActionGlobal.id);

  const [isOpen, setIsOpen] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [isFocus, setIsFocus] = useState(false);

  const handleChangeTitle = () => {
    if (inputRef.current) {
      if (axe.nom) {
        inputRef.current.value !== axe.nom &&
          updatePlan({id: axe.id, nom: inputRef.current.value.trim()});
      } else {
        inputRef.current.value.trim().length > 0 &&
          updatePlan({id: axe.id, nom: inputRef.current.value.trim()});
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
      handleChangeTitle();
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
    <div data-test="Axe">
      <div className="group relative flex items-start py-3 pr-4 pl-2 w-full !bg-white">
        <div className="-mt-0.5 pt-2">
          <div className="flex mr-3 group-hover:outline group-hover:outline-gray-100">
            <button
              data-test="BoutonDeplierAxe"
              className="p-0.5"
              onClick={() => setIsOpen(!isOpen)}
            >
              <div
                className={classNames(
                  'h-6 fr-icon-arrow-right-s-fill text-bf500',
                  {
                    'rotate-90': isOpen,
                  }
                )}
              />
            </button>
          </div>
        </div>
        <TextareaControlled
          data-test="TitreAxeInput"
          ref={inputRef}
          className={classNames(
            'grow mb-0 !px-2 text-left !text-base rounded-none !outline-none !resize-none placeholder:text-gray-900 disabled:pointer-events-none disabled:cursor-pointer disabled:text-gray-900',
            {
              'font-bold': isOpen,
              'placeholder:text-gray-400 !outline !outline-blue-500': isFocus,
            }
          )}
          initialValue={axe.nom}
          onBlur={handleChangeTitle}
          placeholder={'Sans titre'}
          disabled={isReadonly}
        />
        {!isReadonly && (
          <SupprimerAxeModal axe={axe} plan={planActionGlobal}>
            <div className="ml-3 -mt-1 pt-2">
              <button
                data-test="SupprimerAxeBouton"
                className="invisible group-hover:visible fr-btn fr-btn--tertiary fr-btn--sm fr-fi-delete-line"
                title="Supprimer ce titre"
              />
            </div>
          </SupprimerAxeModal>
        )}
      </div>
      {isOpen && (
        <div className="flex flex-col gap-4 mt-3 ml-12">
          {!isReadonly && (
            <AxeActions planActionId={planActionGlobal.id} axeId={axe.id} />
          )}
          {axe.fiches && axe.fiches.length !== 0 && (
            <PlanActionAxeFiches ficheIds={axe.fiches} axeId={axe.id} />
          )}
          <div>
            {axe.children &&
              axe.children.map((axe: PlanNode) => displayAxe(axe))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanActionAxe;
