import {useRef, useState} from 'react';
import classNames from 'classnames';

import FicheActionCard from '../FicheAction/FicheActionCard';
import {AxeActions} from './AxeActions';

import {makeCollectivitePlanActionFicheUrl} from 'app/paths';
import {TFicheAction} from '../FicheAction/data/types/alias';
import {TPlanAction} from './data/types/PlanAction';
import {useEditAxe} from './data/useEditAxe';
import TextareaControlled from 'ui/shared/form/TextareaControlled';
import SupprimerAxeModal from './SupprimerAxeModal';

type Props = {
  planActionGlobal: TPlanAction;
  axe: TPlanAction;
  displayAxe: (axe: TPlanAction) => void;
};

const PlanActionAxe = ({planActionGlobal, axe, displayAxe}: Props) => {
  const {mutate: updatePlan} = useEditAxe(planActionGlobal.axe.id);

  const [isOpen, setIsOpen] = useState(false);

  const [isEditable, setIsEditable] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleEditButtonClick = () => {
    setIsEditable(true);
    setTimeout(() => {
      if (inputRef && inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  return (
    <div>
      <div className="group relative flex items-center">
        <button
          className={classNames('flex items-center py-3 pr-4 w-full', {
            'hover:!bg-none active:!bg-none': isEditable,
          })}
          onClick={() => !isEditable && setIsOpen(!isOpen)}
        >
          <div
            className={classNames(
              'fr-fi-arrow-right-s-line scale-90 mt-1 mr-3',
              {
                'rotate-90': isOpen,
              }
            )}
          />
          <TextareaControlled
            ref={inputRef}
            className={classNames(
              'w-full mb-0 text-left disabled:cursor-pointer disabled:text-gray-900 !text-base !outline-none !resize-none',
              {
                'font-bold': isOpen && !isEditable,
                'placeholder:text-gray-900': !isEditable,
              }
            )}
            initialValue={axe.axe.nom}
            placeholder={'Sans titre'}
            disabled={!isEditable}
            onBlur={e => {
              e.target.value &&
                e.target.value.length > 0 &&
                e.target.value !== axe.axe.nom &&
                updatePlan({id: axe.axe.id, nom: e.target.value ?? null});
              setIsEditable(false);
            }}
          />
        </button>
        <button
          className="fr-fi-edit-line invisible group-hover:visible p-2 text-gray-500 scale-90"
          onClick={handleEditButtonClick}
        />
        <SupprimerAxeModal axe={axe.axe} plan={planActionGlobal}>
          <button className="invisible group-hover:visible fr-btn fr-btn--secondary fr-text-default--error fr-fi-delete-line !shadow-none p-2 text-gray-500 scale-90" />
        </SupprimerAxeModal>
      </div>
      {isOpen && (
        <div className="flex flex-col gap-4 mt-3 ml-12">
          <AxeActions
            planActionId={planActionGlobal.axe.id}
            axeId={axe.axe.id}
          />
          {axe.fiches && (
            <div className="grid grid-cols-2 gap-4">
              {axe.fiches.map((fiche: TFicheAction) => (
                <FicheActionCard
                  key={fiche.id}
                  ficheAction={fiche}
                  link={makeCollectivitePlanActionFicheUrl({
                    collectiviteId: fiche.collectivite_id!,
                    planActionUid: planActionGlobal.axe.id.toString(),
                    ficheUid: fiche.id!.toString(),
                  })}
                />
              ))}
            </div>
          )}
          <div>
            {axe.enfants &&
              axe.enfants.map((axe: TPlanAction) => displayAxe(axe))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanActionAxe;
