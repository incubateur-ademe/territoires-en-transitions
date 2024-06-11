import {useCollectiviteId} from 'core-logic/hooks/params';
import {makeCollectiviteTacheUrl} from 'app/paths';
import {referentielToName} from 'app/labels';
import {getActionStatut} from 'ui/referentiels/utils';
import ActionStatutBadge from 'ui/shared/actions/ActionStatutBadge';
import ActionCard from '../../components/ActionCard';
import {useActionListe} from '../data/options/useActionListe';

export const ActionsLieesCards = ({
  actions,
}: {
  actions: string[] | null | undefined;
}) => {
  const {data: actionListe} = useActionListe();
  const collectiviteId = useCollectiviteId()!;

  const actionsLiees =
    actionListe?.filter(action =>
      actions?.some(id => id === action.action_id)
    ) ?? [];

  return actionsLiees.length > 0 ? (
    <div className="grid grid-cols-2 gap-6">
      {actionsLiees.map(action => {
        const {action_id, referentiel, identifiant, nom} = action;

        const statut = getActionStatut(action);

        return (
          <div className="relative self-stretch" key={action_id}>
            <ActionCard
              openInNewTab
              link={makeCollectiviteTacheUrl({
                collectiviteId,
                actionId: action_id,
                referentielId: referentiel,
              })}
              statutBadge={<ActionStatutBadge statut={statut} />}
              details={`Référentiel ${referentielToName[referentiel]}`}
              title={`${identifiant} ${nom}`}
            />
          </div>
        );
      })}
    </div>
  ) : null;
};
