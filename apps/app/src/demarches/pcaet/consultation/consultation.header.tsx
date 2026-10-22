'use client';

import { makeCollectiviteDemarchePcaetUrl } from '@/app/app/paths';
import { DateModificationItem } from '@/app/demarches/pcaet/components/header/date-modification-item';
import { DepotDateItem } from '@/app/demarches/pcaet/components/header/depot-date-item';
import {
  DEMARCHE_PCAET_STATUT_VARIANTS,
  formatDemarcheStatut,
} from '@/app/demarches/pcaet/constants';
import { appLabels } from '@/app/labels/catalog';
import {
  MetadataItem,
  MetadataLine,
  MetadataSeparator,
} from '@/app/ui/metadata-line';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import type { DemarchePcaetPublic } from '@tet/domain/demarches';
import { Badge, Button, PageHeader } from '@tet/ui';

export const ConsultationHeader = ({
  demarche,
}: {
  demarche: DemarchePcaetPublic;
}) => (
  <PageHeader>
    <PageHeader.Title>{demarche.titre}</PageHeader.Title>
    <PageHeader.Actions>
      <Button
        variant="grey"
        size="xs"
        icon="arrow-left-line"
        href={makeCollectiviteDemarchePcaetUrl({
          collectiviteId: demarche.collectiviteId,
        })}
        dataTest="demarches.pcaet.consultation.retour-liste"
      >
        {appLabels.demarcheConsultationRetourListe}
      </Button>
    </PageHeader.Actions>
    <PageHeader.Metadata>
      <MetadataLine>
        {demarche.launchedAt && (
          <MetadataItem
            icon="calendar-event-line"
            label={appLabels.demarcheHeaderDateLancement}
            value={getTextFormattedDate({ date: demarche.launchedAt })}
          />
        )}
        <DepotDateItem dateCreation={demarche.createdAt} />
        <DateModificationItem dateModification={demarche.modifiedAt} />
        {demarche.adoptedAt && (
          <MetadataItem
            icon="check-line"
            label={appLabels.demarcheConsultationAdopteLe}
            value={getTextFormattedDate({ date: demarche.adoptedAt })}
          />
        )}
        {demarche.pilotes.length > 0 && (
          <MetadataItem
            icon="user-line"
            label={
              demarche.pilotes.length > 1
                ? appLabels.demarcheHeaderPilotePluriel
                : appLabels.demarcheHeaderPiloteSingulier
            }
            hideSeparator
            value={demarche.pilotes.map(({ nom }) => nom).join(', ')}
          />
        )}
        <MetadataSeparator />
        <Badge
          title={formatDemarcheStatut(demarche.status)}
          variant={DEMARCHE_PCAET_STATUT_VARIANTS[demarche.status]}
          size="sm"
        />
      </MetadataLine>
    </PageHeader.Metadata>
  </PageHeader>
);
