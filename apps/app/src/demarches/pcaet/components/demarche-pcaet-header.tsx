'use client';

import type { DemarchePcaetUpdatePatch } from '@/app/demarches/pcaet/demarche-pcaet.storage';
import { formatDemarcheStatut } from '@/app/demarches/pcaet/demarche-pcaet.storage';
import type { DemarchePcaet } from '@/app/demarches/pcaet/demarche-pcaet.types';
import { Badge, Divider } from '@tet/ui';
import { DemarchePcaetPilotesField } from './demarche-pcaet-pilotes-field';

type Props = {
  demarche: DemarchePcaet;
  collectiviteId: number;
  onDemarcheChange: (demarche: DemarchePcaet) => void;
  onUpdate: (patch: DemarchePcaetUpdatePatch) => void;
};

export const DemarchePcaetHeader = ({
  demarche,
  collectiviteId,
  onDemarcheChange,
  onUpdate,
}: Props) => {
  const dateCreation = new Date(demarche.dateCreation).toLocaleDateString(
    'fr-FR'
  );
  const isPublished = demarche.statutPublication === 'publie';

  return (
    <header className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <h1 className={'text-[2rem] leading-tight'}>{demarche.titre}</h1>

          <Divider />

          <div className="flex items-center gap-2">
            <span className="text-sm text-grey-7">Créé le {dateCreation}</span>

            <DemarchePcaetPilotesField
              pilotes={demarche.pilotes}
              collectiviteId={collectiviteId}
              disabled={isPublished}
              onChange={(pilotes) => onUpdate({ pilotes })}
            />

            <div className="flex flex-wrap items-center gap-2">
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
              <Badge
                title={formatDemarcheStatut(demarche.statut)}
                variant="info"
                size="xs"
              />
              {isPublished ? (
                <Badge title="Publiée" variant="success" size="xs" />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
