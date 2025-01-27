import { referentielToName } from '@/app/app/labels';
import { makeCollectiviteTacheUrl } from '@/app/app/paths';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import ActionStatutBadge from '@/app/referentiels/actions/action-statut.badge';
import { getActionStatut } from '@/app/referentiels/utils';
import { TActionStatutsRow } from '@/app/types/alias';
import { Button, Card } from '@/ui';
import { objectToCamel } from 'ts-case-convert';

type ActionCardProps = {
  isReadonly?: boolean;
  action: TActionStatutsRow;
  openInNewTab?: boolean;
  onUnlink?: () => void;
};

const ActionLinkedCard = ({
  isReadonly = true,
  action,
  openInNewTab = false,
  onUnlink,
}: ActionCardProps) => {
  const collectiviteId = useCollectiviteId()!;
  const { action_id: actionId, identifiant, nom, referentiel } = action;
  const statut = getActionStatut(objectToCamel(action));

  const link = makeCollectiviteTacheUrl({
    collectiviteId,
    actionId: actionId,
    referentielId: referentiel,
  });

  return (
    <div className="relative group">
      <div className="invisible group-hover:visible absolute top-4 right-4">
        {!isReadonly && onUnlink && (
          <Button
            icon="link-unlink"
            title="Dissocier l'action"
            variant="grey"
            size="xs"
            onClick={onUnlink}
          />
        )}
      </div>

      <Card
        dataTest="ActionCarte"
        id={`action-${action.action_id}`}
        className="h-full px-4 py-[1.125rem] !gap-3 text-grey-8 hover:border-primary-3 hover:!bg-primary-1 !shadow-none transition"
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
    </div>
  );
};

export default ActionLinkedCard;
