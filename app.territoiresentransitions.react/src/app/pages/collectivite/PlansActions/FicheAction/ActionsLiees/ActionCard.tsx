import {Card} from '@tet/ui';
import {referentielToName} from 'app/labels';
import {makeCollectiviteTacheUrl} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';
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
    <Card
      data-test="ActionCarte"
      id={`action-${action.action_id}`}
      className="px-4 py-[1.125rem] !gap-3 text-grey-8 hover:border-primary-3 hover:!bg-primary-1 !shadow-none transition"
      href={link}
      external={openInNewTab}
      header={
        // Statut de l'action
        <ActionStatutBadge statut={statut} />
      }
    >
      {/* Référentiel de l'action */}
      <span className="text-grey-8 text-sm font-medium">
        Référentiel {referentielToName[referentiel]}
      </span>

      {/* Identifiant et titre de l'action */}
      <span className="text-base font-bold text-primary-9">
        {identifiant} {nom}
      </span>
    </Card>
  );
};

export default ActionCard;
