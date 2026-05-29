'use client';

import type { DemarchePcaetUpdatePatch } from '@/app/demarches/pcaet/demarche-pcaet.storage';
import { formatDemarcheStatut } from '@/app/demarches/pcaet/demarche-pcaet.storage';
import type { DemarchePcaet } from '@/app/demarches/pcaet/demarche-pcaet.types';
import { MetadataItem, MetadataItemPersonne, MetadataLine } from '@/app/ui/metadata-line';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import { Badge, Divider, Input, InlineEditWrapper } from '@tet/ui';
import { format } from 'date-fns';

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

  const dateLancement = demarche.dateLancement
    ? new Date(demarche.dateLancement)
    : null;

  return (
    <header className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className={'text-[2rem] leading-tight'}>{demarche.titre}</h1>
        </div>

        <div className="flex flex-col gap-2 min-w-0">
          <Divider />

          <MetadataLine>
            <InlineEditWrapper
              disabled={isPublished}
              renderOnEdit={({ openState }) => (
                <Input
                  type="date"
                  min="1900-01-01"
                  max="2100-01-01"
                  autoFocus
                  value={
                    dateLancement ? format(dateLancement, 'yyyy-MM-dd') : ''
                  }
                  onChange={(e) => {
                    const date = e.target.value
                      ? new Date(e.target.value)
                      : null;
                    onUpdate({
                      dateLancement: date ? date.toISOString() : null,
                    });
                  }}
                  onKeyDown={(evt) => {
                    if (evt.key === 'Enter' || evt.key === 'Escape') {
                      openState.setIsOpen(false);
                    }
                  }}
                />
              )}
            >
              <MetadataItem
                interactive={!isPublished}
                icon="calendar-event-line"
                label="Date de lancement"
                value={
                  dateLancement
                    ? getTextFormattedDate({
                        date: format(dateLancement, 'yyyy-MM-dd'),
                      })
                    : ''
                }
              />
            </InlineEditWrapper>
            <MetadataItem
              icon="calendar-check-line"
              label="Dépôt commencé le"
              value={dateCreation}
            />
            <MetadataItemPersonne
              hideSeparator
              icon="user-line"
              isReadOnly={isPublished}
              label={{ one: 'Pilote', many: 'Pilotes' }}
              personnes={demarche.pilotes.map((p) => ({
                tagId: p.tagId,
                userId: p.userId,
                tagName: p.tagId ? p.nom : null,
                userName: p.userId ? p.nom : null,
              }))}
              onChange={(personnes) =>
                onUpdate({
                  pilotes: personnes.map((p) => ({
                    nom: p.userName || p.tagName || '',
                    tagId: p.tagId,
                    userId: p.userId,
                  })),
                })
              }
            />
            <div className="w-[1px] h-4 bg-primary-3 shrink-0" />
            <div className="flex items-center gap-2">
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
              <div className="w-[1px] h-4 bg-primary-3 shrink-0" />
              <Badge
                title={formatDemarcheStatut(demarche.statut)}
                variant="info"
                size="xs"
              />
              {isPublished ? (
                <Badge title="Publiée" variant="success" size="xs" />
              ) : null}
            </div>
          </MetadataLine>
          <Divider />
        </div>
      </div>
    </header>
  );
};
