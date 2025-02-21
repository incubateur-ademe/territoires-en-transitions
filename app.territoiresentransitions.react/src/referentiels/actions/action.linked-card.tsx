import { referentielToName } from '@/app/app/labels';
import { makeReferentielTacheUrl } from '@/app/app/paths';
import { useCollectiviteId } from '@/app/collectivites/collectivite-context';
import ActionStatutBadge from '@/app/referentiels/actions/action-statut/action-statut.badge';
import { ActionWithStatut } from '@/app/referentiels/actions/use-list-actions';
import { Button, Card } from '@/ui';

type ActionCardProps = {
  isReadonly?: boolean;
  action: ActionWithStatut;
  openInNewTab?: boolean;
  onUnlink?: () => void;
};

const ActionLinkedCard = ({
  isReadonly = true,
  action,
  openInNewTab = false,
  onUnlink,
}: ActionCardProps) => {
  const collectiviteId = useCollectiviteId();
  const { actionId, identifiant, nom, referentiel, statut } = action;

  const link = makeReferentielTacheUrl({
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
        id={`action-${actionId}`}
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
