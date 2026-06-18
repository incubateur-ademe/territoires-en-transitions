'use client';

import type { DemarchePcaetUpdatePatch } from '@/app/demarches/pcaet/demarche-pcaet.storage';
import type { DemarchePcaet } from '@/app/demarches/pcaet/demarche-pcaet.types';
import { MetadataLine } from '@/app/ui/metadata-line';
import { PageHeader } from '@tet/ui';
import { JSX } from 'react';
import { DateLancementField } from './date-lancement-field';
import { DateModificationItem } from './date-modification-item';
import { DepotDateItem } from './depot-date-item';
import { ObligationField } from './obligation-field';
import { PilotesField } from './pilotes-field';
import { Separator } from './separator';
import { StatutBadges } from './statut-badges';

type Props = {
  demarche: DemarchePcaet;
  collectiviteId: number;
  compact?: boolean;
  shadow?: boolean;
  onDemarcheChange: (demarche: DemarchePcaet) => void;
  onUpdate: (patch: DemarchePcaetUpdatePatch) => void;
};

export const DemarchePcaetHeader = ({
  demarche,
  collectiviteId,
  compact,
  shadow,
  onDemarcheChange,
  onUpdate,
}: Props): JSX.Element => {
  const isPublished = demarche.statutPublication === 'publie';

  return (
    <div
      className={[
        'transition-shadow duration-200',
        shadow ? 'shadow-md' : 'shadow-none',
      ].join(' ')}
    >
    <PageHeader compact={compact}>
      <PageHeader.Title>{demarche.titre}</PageHeader.Title>
      <PageHeader.Metadata>
        <MetadataLine>
          <DateLancementField
            dateLancement={demarche.dateLancement}
            disabled={isPublished}
            onChange={(dateLancement) => onUpdate({ dateLancement })}
          />
          <DepotDateItem dateCreation={demarche.dateCreation} />
          <DateModificationItem dateModification={demarche.dateModification} />
          <PilotesField
            pilotes={demarche.pilotes}
            readOnly={isPublished}
            onChange={(pilotes) => onUpdate({ pilotes })}
          />
          <Separator />
          <ObligationField
            obligation={demarche.obligation}
            readOnly={isPublished}
            onChange={(obligation) => onUpdate({ obligation })}
          />
          <Separator />
          <StatutBadges statut={demarche.statut} isPublished={isPublished} />
        </MetadataLine>
      </PageHeader.Metadata>
    </PageHeader>
  );
};
