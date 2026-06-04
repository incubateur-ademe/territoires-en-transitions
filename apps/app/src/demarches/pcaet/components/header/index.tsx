'use client';

import type { DemarchePcaetUpdatePatch } from '@/app/demarches/pcaet/demarche-pcaet.storage';
import type { DemarchePcaet } from '@/app/demarches/pcaet/demarche-pcaet.types';
import { MetadataLine } from '@/app/ui/metadata-line';
import { PageHeader } from '@tet/ui';
import { JSX } from 'react';
import { DateLancementField } from './date-lancement-field';
import { DepotDateItem } from './depot-date-item';
import { ObligationStatutBadges } from './obligation-statut-badges';
import { PilotesField } from './pilotes-field';
import { Separator } from './separator';

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
}: Props): JSX.Element => {
  const isPublished = demarche.statutPublication === 'publie';

  return (
    <PageHeader>
      <PageHeader.Title>{demarche.titre}</PageHeader.Title>
      <PageHeader.Metadata>
        <MetadataLine>
          <DateLancementField
            dateLancement={demarche.dateLancement}
            disabled={isPublished}
            onChange={(dateLancement) => onUpdate({ dateLancement })}
          />
          <DepotDateItem dateCreation={demarche.dateCreation} />
          <PilotesField
            pilotes={demarche.pilotes}
            readOnly={isPublished}
            onChange={(pilotes) => onUpdate({ pilotes })}
          />
          <Separator />
          <ObligationStatutBadges
            obligation={demarche.obligation}
            statut={demarche.statut}
            isPublished={isPublished}
          />
        </MetadataLine>
      </PageHeader.Metadata>
    </PageHeader>
  );
};
