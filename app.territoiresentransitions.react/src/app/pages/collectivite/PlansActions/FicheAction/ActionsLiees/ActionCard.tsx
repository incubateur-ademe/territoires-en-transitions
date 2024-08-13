import {referentielToName} from 'app/labels';
import {makeCollectiviteTacheUrl} from 'app/paths';
import classNames from 'classnames';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {NavLink} from 'react-router-dom';
import {TActionStatutsRow} from 'types/alias';
import {getActionStatut} from 'ui/referentiels/utils';
import ActionStatutBadge from 'ui/shared/actions/ActionStatutBadge';

type ActionCardProps = {
  action: TActionStatutsRow;
  openInNewTab?: boolean;
};

const ActionCard = ({action, openInNewTab = false}: ActionCardProps) => {
  const collectiviteId = useCollectiviteId()!;
  const {action_id: actionId, identifiant, nom, referentiel} = action;
  const statut = getActionStatut(action);

  const link = makeCollectiviteTacheUrl({
    collectiviteId,
    actionId: actionId,
    referentielId: referentiel,
  });

  return (
    <div
      data-test="ActionCarte"
      id={`action-${action.action_id}`}
      className="h-full rounded-xl border border-grey-3 bg-white hover:border-primary-3 hover:bg-primary-1 transition"
    >
      <NavLink
        to={link}
        target={openInNewTab ? '_blank' : undefined}
        rel={openInNewTab ? 'noopener noreferrer' : undefined}
        className={classNames('block bg-none h-full', {
          'after:!hidden': openInNewTab,
        })}
      >
        <div className="h-full px-4 py-[1.125rem] flex flex-col gap-3 text-grey-8">
          {/* Statut de l'action */}
          <ActionStatutBadge statut={statut} />

          {/* Référentiel de l'action */}
          <span className="text-grey-8 text-sm font-medium">
            Référentiel {referentielToName[referentiel]}
          </span>

          {/* Identifiant et titre de l'action */}
          <span className="text-base font-bold text-primary-9">
            {identifiant} {nom}
          </span>
        </div>
      </NavLink>
    </div>
  );
};

export default ActionCard;
