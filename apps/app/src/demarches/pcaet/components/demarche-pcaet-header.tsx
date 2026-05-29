'use client';

import type { DemarchePcaetUpdatePatch } from '@/app/demarches/pcaet/demarche-pcaet.storage';
import { formatDemarcheStatut } from '@/app/demarches/pcaet/demarche-pcaet.storage';
import type { DemarchePcaet } from '@/app/demarches/pcaet/demarche-pcaet.types';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import { Badge, Button, Divider, Input, InlineEditWrapper } from '@tet/ui';
import { format } from 'date-fns';
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

  const dateLancement = demarche.dateLancement
    ? new Date(demarche.dateLancement)
    : null;

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
            <div className="flex items-center gap-1.5 text-sm text-grey-7">
              <span>Date de lancement : </span>
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
                <span className="cursor-pointer hover:opacity-80 transition-opacity text-grey-8">
                  {dateLancement ? (
                    getTextFormattedDate({
                      date: format(dateLancement, 'yyyy-MM-dd'),
                    })
                  ) : (
                    <span className="text-grey-7">À renseigner</span>
                  )}
                </span>
              </InlineEditWrapper>
            </div>

            <Separator />

            <span className="text-sm text-grey-7">
              Dépôt commencé le : {dateCreation}
            </span>

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
