import { appLabels } from '@/app/labels/catalog';
import { MetadataItem } from '@/app/ui/metadata-line';
import { JSX } from 'react';

export const DateModificationItem = ({
  dateModification,
}: {
  dateModification: string;
}): JSX.Element => (
  <MetadataItem
    icon="pencil-line"
    label={appLabels.demarchePcaetHeaderModifieLe}
    value={new Date(dateModification).toLocaleDateString('fr-FR')}
  />
);
