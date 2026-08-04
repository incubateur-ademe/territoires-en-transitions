'use client';

import type { DemarchePcaetUpdatePatch } from '@/app/demarches/pcaet/demarche-pcaet.types';
import { DemarchePcaetPublicationStatusEnum } from '@tet/domain/demarches';
import type { DemarchePcaet } from '@/app/demarches/pcaet/demarche-pcaet.types';
import { MetadataLine } from '@/app/ui/metadata-line';
import { PageHeader } from '@tet/ui';
import { JSX, ReactNode } from 'react';
import { DemarcheMenuButton } from '../demarche-menu.button';
import { DateLancementField } from './date-lancement-field';
import { DateModificationItem } from './date-modification-item';
import { DepotDateItem } from './depot-date-item';
import { ObligationField } from './obligation-field';
import { PilotesField } from './pilotes-field';
import { Separator } from './separator';
import { StatutBadges } from './statut-badges';

type Props = {
  demarche: DemarchePcaet;
  compact?: boolean;
  shadow?: boolean;
  sidePanelAction?: ReactNode;
  onUpdate: (patch: DemarchePcaetUpdatePatch) => void;
};

export const DemarchePcaetHeader = ({
  demarche,
  compact,
  shadow,
  sidePanelAction,
  onUpdate,
}: Props): JSX.Element => {
  const isPublished =
    demarche.statutPublication === DemarchePcaetPublicationStatusEnum.PUBLISHED;

  return (
    <div
      className={[
        'transition-shadow duration-200',
        shadow ? 'shadow-md' : 'shadow-none',
      ].join(' ')}
    >
      <PageHeader compact={compact}>
        <PageHeader.EditableTitle
          isReadonly={isPublished}
          title={demarche.titre}
          onUpdate={(value) => {
            // Le backend refuse un titre vide : on ignore l'effacement.
            const titre = value?.trim();
            if (titre) onUpdate({ titre });
          }}
        />
        <PageHeader.Actions>
          <div className="flex flex-row items-center gap-2">
            <DemarcheMenuButton />
            {sidePanelAction}
          </div>
        </PageHeader.Actions>
        <PageHeader.Metadata>
          <MetadataLine>
            <DateLancementField
              dateLancement={demarche.dateLancement}
              disabled={isPublished}
              onChange={(dateLancement) => onUpdate({ dateLancement })}
            />
            <DepotDateItem dateCreation={demarche.dateCreation} />
            <DateModificationItem
              dateModification={demarche.dateModification}
            />
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
            <StatutBadges isPublished={isPublished} />
          </MetadataLine>
        </PageHeader.Metadata>
      </PageHeader>
    </div>
  );
};
