import { useState } from 'react';

import { makeReferentielActionUrl } from '@/app/app/paths';
import ActionEditModal from '@/app/referentiels/actions/action-edit.modal';
import Markdown from '@/app/ui/Markdown';
import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  ActionType,
  ActionWithScore,
  getReferentielIdFromActionId,
} from '@tet/domain/referentiels';
import { Button, Card } from '@tet/ui';
import { ScoreProgressBar } from '../scores/score.progress-bar';
import { ScoreRatioBadge } from '../scores/score.ratio-badge';

/** Carte générique d'une mesure du référentiel */
type ActionCardProps = {
  action: ActionWithScore;
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
        className="font-normal h-full !gap-2 !p-4 !bg-grey-1 hover:!border-grey-3 hover:!bg-grey-2 !shadow-none"
      >
        {/** Title + description */}
        <span className="text-base leading-5 font-bold text-primary-9">
          {identifiant} {title}
        </span>

        {showDescription && description && (
          <Markdown
            className="htmlContent [&_*]:text-sm [&_*]:leading-6 text-grey-8 [&>*]:font-normal"
            content={description}
          />
        )}

        {/** Score */}
        <div className="w-full flex max-sm:flex-col gap-3 sm:items-center justify-between">
          <ScoreProgressBar
            id={id}
            identifiant={identifiant}
            type={'action' as ActionType}
            className="grow shrink max-sm:w-full"
          />
          <div className="shrink-0 flex">
            <ScoreRatioBadge actionId={id} size="sm" />
          </div>
        </div>

        {/** Pilotes et services */}
        {(action.pilotes.length > 0 || action.services.length > 0) && (
          <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-primary-10">
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
