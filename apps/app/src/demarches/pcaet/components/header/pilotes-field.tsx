import type { DemarchePcaet } from '@/app/demarches/pcaet/demarche-pcaet.types';
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
    label={{ one: 'Pilote', many: 'Pilotes' }}
    personnes={pilotes.map((p) => ({
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
