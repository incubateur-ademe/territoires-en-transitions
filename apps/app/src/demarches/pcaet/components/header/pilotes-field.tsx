import type { DemarchePcaet } from '@/app/demarches/pcaet/demarche-pcaet.types';
import { appLabels } from '@/app/labels/catalog';
import { MetadataItemPersonne } from '@/app/ui/metadata-line';
import { JSX } from 'react';

export const PilotesField = ({
  pilotes,
  readOnly,
  onChange,
}: {
  pilotes: DemarchePcaet['pilotes'];
  readOnly: boolean;
  onChange: (pilotes: DemarchePcaet['pilotes']) => void;
}): JSX.Element => (
  <MetadataItemPersonne
    hideSeparator
    icon="user-line"
    isReadOnly={readOnly}
    tooltip="Ces personnes recevront les notifications mails liées à la démarche"
    label={{
      one: appLabels.demarchePcaetHeaderPiloteSingulier,
      many: appLabels.demarchePcaetHeaderPilotePluriel,
    }}
    personnes={pilotes.map((p) => ({
      nom: p.nom,
      tagId: p.tagId,
      userId: p.userId,
      tagName: p.tagId ? p.nom : null,
      userName: p.userId ? p.nom : null,
    }))}
    onChange={(personnes) =>
      onChange(
        personnes.map((p) => ({
          nom: p.userName || p.tagName || '',
          tagId: p.tagId,
          userId: p.userId,
        }))
      )
    }
  />
);
