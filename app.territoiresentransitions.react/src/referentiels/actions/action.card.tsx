import { useState } from 'react';

import { makeReferentielActionUrl } from '@/app/app/paths';
import { useCurrentCollectivite } from '@/app/collectivites/collectivite-context';
import ActionEditModal from '@/app/referentiels/actions/action-edit.modal';
import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import {
  Action,
  ActionType,
  getReferentielIdFromActionId,
} from '@/domain/referentiels';
import { Button, Card } from '@/ui';
import ScoreProgressBar from '../scores/score.progress-bar';
import { ScoreRatioBadge } from '../scores/score.ratio-badge';

/** Carte générique d'une mesure du référentiel */
type ActionCardProps = {
  action: Action;
  showDescription?: boolean;
};

export const ActionCard = ({ action, showDescription }: ActionCardProps) => {
  const { actionId: id, identifiant, nom: title, description } = action;
  const { collectiviteId, isReadOnly } = useCurrentCollectivite();

  const referentiel = getReferentielIdFromActionId(id);

  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <div className="relative group h-full">
      {/** Hover menu */}
      <div className="invisible group-hover:visible absolute top-4 right-4 flex gap-2">
        {isEditOpen && (
          <ActionEditModal
            actionId={id}
            actionTitle={`${identifiant} ${title}`}
            pilotes={action.pilotes}
            services={action.services}
            openState={{
              isOpen: isEditOpen,
              setIsOpen: setIsEditOpen,
            }}
          />
        )}
        {!isReadOnly && (
          <Button
            icon="edit-line"
            title="Modifier"
            variant="grey"
            size="xs"
            onClick={() => setIsEditOpen(!isEditOpen)}
          />
        )}
      </div>
      <Card
        href={makeReferentielActionUrl({
          collectiviteId,
          referentielId: referentiel,
          actionId: id,
        })}
        className="font-normal h-full"
      >
        {/** Title + description */}
        <div className="flex-grow">
          <span className="text-lg font-bold text-primary-9">
            {identifiant} {title}
          </span>

          {showDescription && description && (
            <p
              className="htmlContent text-sm text-grey-9 font-light my-6"
              dangerouslySetInnerHTML={{
                __html: description,
              }}
            />
          )}
        </div>

        {/** Score */}
        <div className="mt-auto">
          <ScoreRatioBadge actionId={id} className={'mb-3'} />
          <ScoreProgressBar
            id={id}
            identifiant={identifiant}
            type={'action' as ActionType}
            className="w-full"
          />
        </div>

        {/** Pilotes et services */}
        {(action.pilotes.length > 0 || action.services.length > 0) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-primary-10">
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
