import { useCollectiviteId } from '@/api/collectivites';
import { referentielToName } from '@/app/app/labels';
import { makeReferentielTacheUrl } from '@/app/app/paths';
import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { Action, ActionTypeEnum } from '@/domain/referentiels';
import { Button, Card } from '@/ui';
import { ScoreProgressBar } from '../scores/score.progress-bar';
import { ScoreRatioBadge } from '../scores/score.ratio-badge';

type ActionCardProps = {
  isReadonly?: boolean;
  action: Action;
  externalCollectiviteId?: number;
  openInNewTab?: boolean;
  onUnlink?: () => void;
};

const ActionLinkedCard = ({
  isReadonly = true,
  action,
  externalCollectiviteId,
  openInNewTab = false,
  onUnlink,
}: ActionCardProps) => {
  const currentCollectiviteId = useCollectiviteId();
  const dataCollectiviteId = externalCollectiviteId ?? currentCollectiviteId;
  const { actionId, identifiant, nom, referentiel } = action;

  const link = makeReferentielTacheUrl({
    collectiviteId: dataCollectiviteId,
    actionId,
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
        className="h-full !p-4 !gap-2 text-grey-8 hover:border-primary-3 hover:!bg-primary-1 !shadow-none transition"
        href={link}
        external={openInNewTab}
      >
        {/* Référentiel de l'action */}
        <span className="text-grey-8 text-sm font-medium">
          Référentiel {referentielToName[referentiel]}
        </span>

        {/* Identifiant et titre de l'action */}
        <span className="text-base leading-5 font-bold text-primary-9">
          {identifiant} {nom}
        </span>

        {/** Score */}
        <div className="w-full flex max-sm:flex-col gap-3 sm:items-center justify-between">
          <ScoreProgressBar
            id={actionId}
            identifiant={identifiant}
            type={ActionTypeEnum.ACTION}
            className="grow shrink max-sm:w-full"
            externalCollectiviteId={externalCollectiviteId}
          />
          <div className="shrink-0 flex">
            <ScoreRatioBadge
              actionId={actionId}
              size="sm"
              externalCollectiviteId={externalCollectiviteId}
            />
          </div>
        </div>

        {/** Pilotes et services */}
        {(action.pilotes.length > 0 || action.services.length > 0) && (
          <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-normal text-primary-10">
            {action.pilotes.length > 0 && (
              <ListWithTooltip
                icon="user-line"
                title="Pilotes"
                list={action.pilotes.map((p) => p.nom ?? '')}
              />
            )}
            {action.pilotes.length > 0 && action.services.length > 0 && (
              <div className="w-[0.5px] h-4 bg-grey-5" />
            )}
            {action.services.length > 0 && (
              <ListWithTooltip
                icon="leaf-line"
                title="Direction ou service pilote"
                list={action.services.map((s) => s.nom ?? '')}
              />
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ActionLinkedCard;
