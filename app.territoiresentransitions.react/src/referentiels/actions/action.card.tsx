import { useState } from 'react';

import { makeReferentielActionUrl } from '@/app/app/paths';
import { getReferentielIdFromActionId } from '@/domain/referentiels';
import { Button, Card } from '@/ui';
import { ActionDefinitionSummary } from '../ActionDefinitionSummaryReadEndpoint';
import ScoreProgressBar from '../scores/score.progress-bar';
import { ScoreRatioBadge } from '../scores/score.ratio-badge';
import { useCollectiviteId } from '@/app/collectivites/collectivite-context';
import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { useActionPilotesList } from '@/app/referentiels/actions/use-action-pilotes';
import { useActionServicesPilotesList } from '@/app/referentiels/actions/use-action-services-pilotes';
import ActionEditModal from '@/app/referentiels/actions/action-edit.modal';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';

/** Carte générique d'une mesure du référentiel */
type ReferentielCardProps = {
  action: ActionDefinitionSummary;
  isDescriptionOn: boolean;
};

export const ActionCard = ({
  action,
  isDescriptionOn,
}: ReferentielCardProps) => {
  const { collectiviteId, isReadOnly } = useCurrentCollectivite()!;

  const referentiel = getReferentielIdFromActionId(action.id);

  const { data: pilotes } = useActionPilotesList(action.id);
  const { data: services } = useActionServicesPilotesList(action.id);

  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <div className="relative group h-full">
      {/** Hover menu */}
      <div className="invisible group-hover:visible absolute top-4 right-4 flex gap-2">
        {isEditOpen && (
          <ActionEditModal
            actionId={action.id}
            actionTitle={`${action.identifiant} ${action.nom}`}
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
          actionId: action.id,
        })}
        className="font-normal h-full"
      >
        {/** Compétence (For future use) */}
        {/**
          <div className="flex items-center gap-3">
            <Badge state="standard" title="Compétence 1" size="sm" />
          </div>
         */}

        {/** Title + description */}
        <div className="flex-grow">
          <span className="text-lg font-bold text-primary-9">
            {action.identifiant} {action.nom}
          </span>

          {isDescriptionOn && action.description && (
            <p
              className="htmlContent text-sm text-grey-9 font-light my-6"
              dangerouslySetInnerHTML={{
                __html: action.description,
              }}
            />
          )}
        </div>

        {/** Score */}
        <div className="mt-auto">
          <ScoreRatioBadge actionId={action.id} className={'mb-3'} />
          <ScoreProgressBar
            actionDefinition={action}
            progressBarStyleOptions={{ fullWidth: true }}
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
