import { MetadataItem } from '@/app/ui/metadata-line';
import { JSX } from 'react';

export const DepotDateItem = ({
  dateCreation,
}: {
  dateCreation: string;
}): JSX.Element => (
  <MetadataItem
    icon="calendar-check-line"
    label="Dépôt commencé le"
    value={new Date(dateCreation).toLocaleDateString('fr-FR')}
  />
);
