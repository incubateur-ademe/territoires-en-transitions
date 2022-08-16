import {ActionStatutHistorique} from 'app/pages/collectivite/Historique/ActionStatutHistorique';
import {useHistoricalActionStatuts} from 'app/pages/collectivite/Historique/useActionHistorique';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {IHistoricalActionStatutRead} from 'generated/dataLayer/historical_action_statut_read';

export const ActionHistorique = ({
  historicalActionStatuts,
}: {
  historicalActionStatuts: IHistoricalActionStatutRead[];
}) => {
  return (
    <div className="flex flex-col gap-5">
      {historicalActionStatuts.map(historicalActionStatut => (
        <div
          data-test={`action-statut-historique-${historicalActionStatut.action_id}`}
          key={`${historicalActionStatut.action_id}-${historicalActionStatut.modified_at}`}
        >
          <ActionStatutHistorique {...historicalActionStatut} />
        </div>
      ))}
    </div>
  );
};

export default ({actionId}: {actionId: string}) => {
  const collectiviteId = useCollectiviteId()!;
  const historicalActionStatuts = useHistoricalActionStatuts({
    collectiviteId,
    actionId,
  });
  return <ActionHistorique historicalActionStatuts={historicalActionStatuts} />;
};
