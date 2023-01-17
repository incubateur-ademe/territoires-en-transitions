import {useRef, useState} from 'react';
import classNames from 'classnames';

import FicheActionCard from '../FicheAction/FicheActionCard';
import {AxeActions} from './AxeActions';

import {makeCollectivitePlanActionFicheUrl} from 'app/paths';
import {TFicheAction} from '../FicheAction/data/types/alias';
import {TPlanAction} from './data/types/PlanAction';
import {useEditAxe} from './data/useEditAxe';

type Props = {
  plan_id: number;
  axe: TPlanAction;
  displayAxe: (axe: TPlanAction) => void;
};

const PlanActionAxe = ({plan_id, axe, displayAxe}: Props) => {
  const {mutate: updatePlan} = useEditAxe(plan_id);

  const [isOpen, setIsOpen] = useState(false);

  const [isEditable, setIsEditable] = useState(false);
  const [nom, setNom] = useState(axe.nom);

  const inputRef = useRef<HTMLInputElement>(null);

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
          className="flex items-center py-3 pr-4 w-full"
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
          <input
            ref={inputRef}
            type="text"
            className={classNames(
              'w-full mb-0 text-left disabled:cursor-pointer disabled:text-gray-900',
              {
                'font-bold': isOpen && !isEditable,
                'placeholder:text-gray-900': !isEditable,
              }
            )}
            value={nom}
            placeholder={'Sans titre'}
            disabled={!isEditable}
            onChange={e => {
              setNom(e.target.value);
            }}
            onBlur={e => {
              nom &&
                nom.length > 0 &&
                nom !== axe.nom &&
                updatePlan({id: axe.id, nom: nom ?? null});
              setIsEditable(false);
            }}
          />
        </button>
        <button
          className="fr-fi-edit-line hidden group-hover:block p-2 text-gray-500 scale-90"
          onClick={handleEditButtonClick}
        />
      </div>
      {isOpen && (
        <div className="flex flex-col gap-4 mt-3 ml-12">
          <AxeActions planActionId={plan_id} axeId={axe.id} />
          {axe.fiches && (
            <div className="grid grid-cols-2 gap-4">
              {axe.fiches.map((fiche: TFicheAction) => (
                <FicheActionCard
                  key={fiche.id}
                  ficheAction={fiche}
                  link={makeCollectivitePlanActionFicheUrl({
                    collectiviteId: fiche.collectivite_id!,
                    planActionUid: plan_id.toString(),
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
