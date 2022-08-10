import {IHistoricalActionStatutRead} from 'generated/dataLayer/historical_action_statut_read';
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {format} from 'date-fns';
import {fr} from 'date-fns/locale';
import classNames from 'classnames';

import {fakeActionStatutHistoriqueSimple} from './fixture';

export type TActionStatutHistoriqueProps = IHistoricalActionStatutRead;

type Props = {
  actionStatusHistorique: TActionStatutHistoriqueProps;
};

export const ActionStatutHistorique = ({actionStatusHistorique}: Props) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);
  return (
    <div className="flex gap-6">
      {/* DATE */}
      <div className="pr-6 w-min border-r border-gray-200">
        <span className="py-1 px-2 text-sm uppercase whitespace-nowrap text-blue-600 bg-blue-100 rounded-md">
          {format(
            new Date(actionStatusHistorique.modified_at),
            'ii MMMM yyyy',
            {
              locale: fr,
            }
          )}
        </span>
      </div>
      {/* MAIN */}
      <div className="flex">
        {/* ICON */}
        <div className="mr-4 mt-0.5 fr-fi-information-fill text-blue-600" />
        {/* CONTENT */}
        <div className="flex flex-col">
          <p className="mb-2 font-bold text-blue-600">Action: statut modifié</p>
          <p className="mb-2">
            <span className="text-gray-500">Par: </span>
            {actionStatusHistorique.modified_by}
          </p>
          <p className="mb-2">
            <span className="text-gray-500">Action: </span>
            {actionStatusHistorique.action_identifiant}{' '}
            {actionStatusHistorique.action_nom}
          </p>
          <p className="m-0">
            <span className="text-gray-500">Tâche: </span>
            {actionStatusHistorique.tache_identifiant}{' '}
            {actionStatusHistorique.tache_nom}
          </p>
          {/* DETAILS */}
          <div className="my-4 pb-4 border-t border-b border-gray-200">
            <button
              onClick={() => setIsDetailsOpen(!isDetailsOpen)}
              className="flex items-center w-full py-4 px-2"
            >
              <div className="font-bold">Afficher le détail</div>
              <div
                className={classNames(
                  'ml-auto fr-fi-arrow-down-s-line duration-100',
                  {
                    ['rotate-180']: isDetailsOpen,
                  }
                )}
              />
            </button>
            {isDetailsOpen && (
              <div className="p-2 bg-gray-100">
                <div className="w-min p-2 border-2 border-green-400">
                  <span className="py-1 px-2 font-bold text-sm uppercase text-blue-500 bg-blue-100 rounded-md">
                    {actionStatusHistorique.avancement}
                  </span>
                </div>
              </div>
            )}
          </div>
          <Link
            to="#"
            className="flex items-center ml-auto fr-btn fr-btn--secondary !px-4 border border-bf500"
          >
            Voir la page{' '}
            <span className="ml-1 mt-1 fr-fi-arrow-right-line scale-75" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default () => {
  return (
    <ActionStatutHistorique
      actionStatusHistorique={fakeActionStatutHistoriqueSimple}
    />
  );
};
