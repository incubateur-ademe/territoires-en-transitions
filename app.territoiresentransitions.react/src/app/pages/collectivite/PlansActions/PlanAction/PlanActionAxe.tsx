import {makeCollectivitePlanActionFicheUrl} from 'app/paths';
import classNames from 'classnames';
import {useState} from 'react';
import {TFicheAction} from '../FicheAction/data/types/alias';
import FicheActionCard from '../FicheAction/FicheActionCard';
import {TPlanAction} from './data/types/PlanAction';

type Props = {
  plan_id: number;
  axe: TPlanAction;
  displayAxe: (axe: TPlanAction) => void;
};

const PlanActionAxe = ({plan_id, axe, displayAxe}: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        className="flex items-center py-4 w-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div
          className={classNames('fr-fi-arrow-right-s-line scale-90 mt-1 mr-4', {
            'rotate-90': isOpen,
          })}
        />
        <h6 className="mb-0 text-left">{axe.nom}</h6>
      </button>
      {isOpen && (
        <div className="ml-12">
          {axe.fiches && (
            <div className="flex flex-col gap-4 my-6">
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
          {axe.enfants &&
            axe.enfants.map((axe: TPlanAction) => displayAxe(axe))}
        </div>
      )}
    </div>
  );
};

export default PlanActionAxe;
