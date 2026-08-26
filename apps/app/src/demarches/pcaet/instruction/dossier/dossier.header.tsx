'use client';

import { DateModificationItem } from '@/app/demarches/pcaet/components/header/date-modification-item';
import { DepotDateItem } from '@/app/demarches/pcaet/components/header/depot-date-item';
import { Separator } from '@/app/demarches/pcaet/components/header/separator';
import { appLabels } from '@/app/labels/catalog';
import {
  DEMANDE_AVIS_ETAT_LABELS,
  DEMANDE_AVIS_ETAT_VARIANTS,
} from '../instruction.constants';
import { MetadataItem, MetadataLine } from '@/app/ui/metadata-line';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import type { RouterOutput } from '@tet/api';
import { Badge, PageHeader } from '@tet/ui';
import { ReactNode, useState } from 'react';

type Dossier = RouterOutput['demarches']['pcaet']['getDossierInstruction'];

export const DossierInstructionHeader = ({
  dossier,
  action,
}: {
  dossier: Dossier;
  action: ReactNode;
}) => {
  const [nowMs] = useState(() => Date.now());
  const isEcheancePassee =
    dossier.avisDeadlineAt !== null &&
    new Date(dossier.avisDeadlineAt).getTime() < nowMs;

  return (
    <PageHeader>
      <PageHeader.Title>{dossier.titre}</PageHeader.Title>
      <PageHeader.Actions>{action}</PageHeader.Actions>
      <PageHeader.Metadata>
        <MetadataLine>
          <MetadataItem
            icon="community-line"
            label={appLabels.instructionDossierMetaCollectivite}
            value={dossier.collectivite.nom}
          />
          {dossier.launchedAt && (
            <MetadataItem
              icon="calendar-event-line"
              label={appLabels.demarcheHeaderDateDebut}
              value={getTextFormattedDate({ date: dossier.launchedAt })}
            />
          )}
          <DepotDateItem dateCreation={dossier.createdAt} />
          <DateModificationItem dateModification={dossier.modifiedAt} />
          {dossier.pilotes.length > 0 && (
            <MetadataItem
              icon="user-line"
              label={
                dossier.pilotes.length > 1
                  ? appLabels.demarcheHeaderPilotePluriel
                  : appLabels.demarcheHeaderPiloteSingulier
              }
              value={dossier.pilotes.join(', ')}
            />
          )}
          {dossier.transmittedAt && (
            <MetadataItem
              icon="send-plane-line"
              label={appLabels.instructionDossierMetaTransmis}
              value={getTextFormattedDate({ date: dossier.transmittedAt })}
            />
          )}
          {/* L'échéance ne renseigne plus rien sur un dossier instruit : c'est
              la date de l'avis rendu qui prend sa place. */}
          {dossier.instruitLe ? (
            <MetadataItem
              icon="check-line"
              label={appLabels.instructionDossierMetaInstruitLe}
              hideSeparator
              value={getTextFormattedDate({ date: dossier.instruitLe })}
            />
          ) : (
            dossier.avisDeadlineAt && (
              <MetadataItem
                icon="time-line"
                label={appLabels.instructionDossierMetaEcheance}
                hideSeparator
                value={
                  isEcheancePassee ? (
                    <span className="text-error-1">
                      {appLabels.instructionDossierMetaEcheanceDepassee({
                        date: getTextFormattedDate({
                          date: dossier.avisDeadlineAt,
                        }),
                      })}
                    </span>
                  ) : (
                    getTextFormattedDate({ date: dossier.avisDeadlineAt })
                  )
                }
              />
            )
          )}
          <Separator />
          <Badge
            title={DEMANDE_AVIS_ETAT_LABELS[dossier.etat]}
            variant={DEMANDE_AVIS_ETAT_VARIANTS[dossier.etat]}
            size="sm"
          />
        </MetadataLine>
      </PageHeader.Metadata>
    </PageHeader>
  );
};
