import { Membre } from '@/app/collectivites/membres/list-membres/use-list-membres';
import { appLabels } from '@/app/labels/catalog';
import { MetadataItem } from '@/app/ui/metadata-line';
import { ReactElement } from 'react';

export const ConseillerReferentItem = ({
  conseillers,
  hideSeparator,
}: {
  conseillers: Membre[];
  hideSeparator?: boolean;
}): ReactElement => {
  const names = conseillers
    .map((membre) => [membre.prenom, membre.nom].filter(Boolean).join(' '))
    .filter(Boolean)
    .join(', ');

  return (
    <MetadataItem
      hideSeparator={hideSeparator}
      icon="user-star-line"
      label={appLabels.membreTeteFonctionConseiller}
      value={names || <i>{appLabels.nonRenseigne}</i>}
    />
  );
};
