import { useState } from 'react';

import { makeReferentielActionUrl } from '@/app/app/paths';
import { useCollectiviteId } from '@/app/collectivites/collectivite-context';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import ActionEditModal from '@/app/referentiels/actions/action-edit.modal';
import { useActionPilotesList } from '@/app/referentiels/actions/use-action-pilotes';
import { useActionServicesPilotesList } from '@/app/referentiels/actions/use-action-services-pilotes';
import { Action } from '@/app/referentiels/actions/use-list-actions';
import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import {
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

  const { isReadOnly } = useCurrentCollectivite()!;
  const collectiviteId = useCollectiviteId();
  const referentiel = getReferentielIdFromActionId(id);

  const { data: pilotes } = useActionPilotesList(id);
  const { data: services } = useActionServicesPilotesList(id);

  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <div className="relative group h-full">
      {/** Hover menu */}
      <div className="invisible group-hover:visible absolute top-4 right-4 flex gap-2">
        {isEditOpen && (
          <ActionEditModal
            actionId={id}
            actionTitle={`${identifiant} ${title}`}
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
        {((pilotes && pilotes.length > 0) ||
          (services && services.length > 0)) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-primary-10">
            {pilotes && pilotes.length > 0 && (
              <ListWithTooltip
                icon="user-line"
                title="Pilotes"
                list={pilotes.map((p) =>
                  p.tagId ? p.nom ?? '' : `${p.prenom} ${p.nom}`
                )}
              />
            )}
            {pilotes &&
              pilotes.length > 0 &&
              services &&
              services.length > 0 && (
                <div className="w-[0.5px] h-4 bg-grey-5" />
              )}
            {services && services.length > 0 && (
              <ListWithTooltip
                icon="leaf-line"
                title="Direction ou service pilote"
                list={services.map((s) => s.nom ?? '')}
              />
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
