import {useCollectiviteId} from 'core-logic/hooks/params';
import {makeCollectiviteTacheUrl} from 'app/paths';
import {referentielToName} from 'app/labels';
import {TActionStatutsRow} from 'types/alias';
import ActionStatutBadge from 'ui/shared/actions/ActionStatutBadge';
import ActionCard from '../../components/ActionCard';
import {useActionListe} from '../data/options/useActionListe';

export const ActionsLieesCards = ({
  actions,
}: {
  actions: {id: string}[] | null;
}) => {
  const {data: actionListe} = useActionListe();
  const collectiviteId = useCollectiviteId()!;

  const actionsLiees =
    actionListe?.filter((action: TActionStatutsRow) =>
      actions?.some(v => v.id === action.action_id)
    ) ?? [];

  return actionsLiees.length > 0 ? (
    <div className="grid grid-cols-2 gap-6 mb-8">
      {actionsLiees.map(action => (
        <ActionCard
          key={action.action_id}
          openInNewTab
          link={makeCollectiviteTacheUrl({
            collectiviteId: collectiviteId,
            actionId: action.action_id,
            referentielId: action.referentiel,
          })}
          statutBadge={
            action.avancement && (
              <ActionStatutBadge statut={action.avancement} small />
            )
          }
          details={`Référentiel ${referentielToName[action.referentiel]}`}
          title={`${action.identifiant} ${action.nom}`}
        />
      ))}
    </div>
  ) : null;
};
