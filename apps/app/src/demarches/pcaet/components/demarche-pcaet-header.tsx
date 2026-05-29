'use client';

import type { DemarchePcaetUpdatePatch } from '@/app/demarches/pcaet/demarche-pcaet.storage';
import { formatDemarcheStatut } from '@/app/demarches/pcaet/demarche-pcaet.storage';
import type { DemarchePcaet } from '@/app/demarches/pcaet/demarche-pcaet.types';
import { Badge, Button, Divider } from '@tet/ui';
import { DemarchePcaetPilotesField } from './demarche-pcaet-pilotes-field';

const Separator = () => <div className="w-[1px] h-5 bg-grey-5 shrink-0" />;

type Props = {
  demarche: DemarchePcaet;
  collectiviteId: number;
  onDemarcheChange: (demarche: DemarchePcaet) => void;
  onUpdate: (patch: DemarchePcaetUpdatePatch) => void;
  onPublish: () => void;
  onUnpublish: () => void;
};

export const DemarchePcaetHeader = ({
  demarche,
  collectiviteId,
  onDemarcheChange,
  onUpdate,
  onPublish,
  onUnpublish,
}: Props) => {
  const dateCreation = new Date(demarche.dateCreation).toLocaleDateString(
    'fr-FR'
  );
  const isPublished = demarche.statutPublication === 'publie';

  return (
    <header className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className={'text-[2rem] leading-tight'}>{demarche.titre}</h1>
          <div className="shrink-0">
            {isPublished ? (
              <Button variant="grey" size="sm" onClick={onUnpublish}>
                Repasser en brouillon
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={onPublish}>
                Valider le dépôt pour avis
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 min-w-0">
          <Divider />

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-grey-7">Créé le {dateCreation}</span>

            <Separator />

            <DemarchePcaetPilotesField
              pilotes={demarche.pilotes}
              collectiviteId={collectiviteId}
              disabled={isPublished}
              onChange={(pilotes) => onUpdate({ pilotes })}
            />

            <Separator />

            <Badge
              title={
                demarche.obligation === 'obligatoire'
                  ? 'Obligatoire'
                  : 'Volontaire'
              }
              variant={
                demarche.obligation === 'obligatoire' ? 'error' : 'standard'
              }
              size="xs"
            />
            <Separator />
            <Badge
              title={formatDemarcheStatut(demarche.statut)}
              variant="info"
              size="xs"
            />
            {isPublished ? (
              <>
                <Separator />
                <Badge title="Publiée" variant="success" size="xs" />
              </>
            ) : null}
          </div>
          <Divider />
        </div>
      </div>
    </header>
  );
};
