import { useCollectiviteId } from '@/api/collectivites';
import { referentielToName } from '@/app/app/labels';
import { makeReferentielTacheUrl } from '@/app/app/paths';
import ActionStatutBadge from '@/app/referentiels/actions/action-statut/action-statut.badge';
import { Action, ActionTypeEnum } from '@/domain/referentiels';
import { Button, Card } from '@/ui';
import { ScoreProgressBar } from '../scores/score.progress-bar';
import { ScoreRatioBadge } from '../scores/score.ratio-badge';

type ActionCardProps = {
  isReadonly?: boolean;
  action: Action;
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
        header={statut ? <ActionStatutBadge statut={statut} /> : null}
      >
        {/* Référentiel de l'action */}
        <span className="text-grey-8 text-sm font-medium">
          Référentiel {referentielToName[referentiel]}
        </span>

        {/* Identifiant et titre de l'action */}
        <span className="text-base font-bold text-primary-9">
          {identifiant} {nom}
        </span>

        {/** Score */}
        <div className="mt-auto">
          <ScoreRatioBadge actionId={actionId} className={'mb-3'} />
          <ScoreProgressBar
            id={actionId}
            identifiant={identifiant}
            type={ActionTypeEnum.ACTION}
            className="w-full"
          />
        </div>
      </Card>
    </div>
  );
};

export default ActionLinkedCard;
