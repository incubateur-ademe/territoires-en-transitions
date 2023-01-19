import {NavLink} from 'react-router-dom';

import {TFicheAction} from './data/types/alias';
import FicheActionBadgeStatut from './FicheActionForm/FicheActionBadgeStatut';

type TFicheActionCard = {
  link: string;
  ficheAction: TFicheAction;
};

const FicheActionCard = ({ficheAction, link}: TFicheActionCard) => {
  return (
    <div className="border border-gray-200">
      {ficheAction.id && (
        <NavLink to={link}>
          <div className="flex flex-col h-full p-6">
            {ficheAction.statut && (
              <div className="mb-4">
                <FicheActionBadgeStatut statut={ficheAction.statut} small />
              </div>
            )}
            <div className="-mt-2 mb-3 text-xs text-gray-500">
              {!ficheAction.axes && (
                <span>
                  Fiche non classée{ficheAction.pilotes && <span> | </span>}
                </span>
              )}
              {ficheAction.pilotes && (
                <span>
                  Pilote{ficheAction.pilotes.length > 1 && 's'}:{' '}
                  {ficheAction.pilotes?.map(
                    (pilote: any, index, array) =>
                      `${pilote.nom}${index < array.length - 1 ? ', ' : ''}`
                  )}
                </span>
              )}
            </div>
            <div className="mb-auto font-bold line-clamp-3">
              {ficheAction.titre ?? 'Sans titre'}
            </div>
            <span className="fr-fi-arrow-right-line ml-auto mt-4 text-bf500 scale-75" />
          </div>
        </NavLink>
      )}
    </div>
  );
};

export default FicheActionCard;
