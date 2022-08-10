import {IHistoricalActionStatutRead} from 'generated/dataLayer/historical_action_statut_read';
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {format} from 'date-fns';
import {fr} from 'date-fns/locale';
import classNames from 'classnames';

import {fakeAjoutSimpleActionStatutHistorique} from './fixture';
import ActionStatusBadge from 'ui/shared/ActionStatusBadge/ActionStatusBadge';

import {fakeActionStatutHistoriqueSimple} from './fixture';

export type TActionStatutHistoriqueProps = IHistoricalActionStatutRead;

type Props = {
  actionStatutHistorique: TActionStatutHistoriqueProps;
};

export const ActionStatutHistorique = ({actionStatutHistorique}: Props) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);
  return (
    <div className="flex gap-6">
      {/* DATE */}
      <div className="pr-6 w-min border-r border-gray-200">
        <span className="py-1 px-2 text-sm uppercase whitespace-nowrap text-blue-600 bg-blue-100 rounded-md">
          {format(
            new Date(actionStatutHistorique.modified_at),
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
            {actionStatutHistorique.modified_by_nom}
          </p>
          <p className="mb-2">
            <span className="text-gray-500">Action: </span>
            {actionStatutHistorique.action_identifiant}{' '}
            {actionStatutHistorique.action_nom}
          </p>
          <p className="m-0">
            <span className="text-gray-500">Tâche: </span>
            {actionStatutHistorique.tache_identifiant}{' '}
            {actionStatutHistorique.tache_nom}
          </p>
          {/* DETAILS */}
          <div className="my-4 border-t border-b border-gray-200">
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
              <div className="p-2 mb-4 bg-gray-100">
                <ActionStatutHistoriqueDetails
                  actionStatutHistorique={actionStatutHistorique}
                />
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
      actionStatutHistorique={fakeAjoutSimpleActionStatutHistorique}
    />
  );
};

const ActionStatutHistoriqueDetails = ({
  actionStatutHistorique,
}: {
  actionStatutHistorique: TActionStatutHistoriqueProps;
}) => {
  // Modification simple
  if (
    actionStatutHistorique.previous_avancement !== null &&
    actionStatutHistorique.previous_avancement_detaille === null &&
    actionStatutHistorique.avancement !== 'detaille'
  ) {
    return (
      <>
        <ActionStatutWrapper isPrevious>
          <ActionStatusBadge
            status={actionStatutHistorique.previous_avancement}
            barre
          />
        </ActionStatutWrapper>
        <ActionStatutWrapper>
          <ActionStatusBadge status={actionStatutHistorique.avancement} />
        </ActionStatutWrapper>
      </>
    );
  }

  // Modification simple à détaillée
  if (
    actionStatutHistorique.avancement === 'detaille' &&
    actionStatutHistorique.previous_avancement !== 'detaille' &&
    actionStatutHistorique.previous_avancement !== null &&
    actionStatutHistorique.avancement_detaille !== null
  ) {
    return (
      <>
        <ActionStatutWrapper isPrevious>
          <ActionStatusBadge
            status={actionStatutHistorique.previous_avancement}
            barre
          />
        </ActionStatutWrapper>
        <ActionStatutWrapper>
          <ActionDetaille
            avancementDetaille={actionStatutHistorique.avancement_detaille}
          />
        </ActionStatutWrapper>
      </>
    );
  }
  // Modification détaillé à détaillée
  if (
    actionStatutHistorique.avancement === 'detaille' &&
    actionStatutHistorique.previous_avancement === 'detaille' &&
    actionStatutHistorique.avancement_detaille &&
    actionStatutHistorique.previous_avancement_detaille
  ) {
    return (
      <>
        <ActionStatutWrapper isPrevious>
          <ActionDetaille
            isPrevious
            avancementDetaille={
              actionStatutHistorique.previous_avancement_detaille
            }
          />
        </ActionStatutWrapper>
        <ActionStatutWrapper>
          <ActionDetaille
            avancementDetaille={actionStatutHistorique.avancement_detaille}
          />
        </ActionStatutWrapper>
      </>
    );
  }

  // Ajout simple
  return (
    <ActionStatutWrapper>
      <ActionStatusBadge status={actionStatutHistorique.avancement} />
    </ActionStatutWrapper>
  );
};

const ActionStatutWrapper = ({
  children,
  isPrevious,
}: {
  children: JSX.Element;
  isPrevious?: boolean;
}) => (
  <div
    className={classNames('w-min p-2 border-2 border-green-400', {
      ['border-red-400 mb-4']: isPrevious,
    })}
  >
    {children}
  </div>
);

const ActionDetaille = ({
  avancementDetaille,
  isPrevious,
}: {
  avancementDetaille: number[];
  isPrevious?: boolean;
}) => (
  <>
    <ActionStatusBadge status="detaille" barre={isPrevious} />
    <div className="mt-2">
      <p
        className={classNames('mb-0.5 text-sm whitespace-nowrap', {
          ['line-through']: isPrevious,
        })}
      >
        Fait: {avancementDetaille[0] * 100} %
      </p>
      <p
        className={classNames('mb-0.5 text-sm whitespace-nowrap', {
          ['line-through']: isPrevious,
        })}
      >
        Programmé: {avancementDetaille[1] * 100} %
      </p>
      <p
        className={classNames('mb-0 text-sm whitespace-nowrap', {
          ['line-through']: isPrevious,
        })}
      >
        Pas fait: {avancementDetaille[2] * 100} %
      </p>
    </div>
  </>
);
