'use client';

import { appLabels } from '@/app/labels/catalog';
import ReferentsDropdown from '@/app/referentiels/tableau-de-bord/referents/ReferentsDropdown';
import { MetadataItem } from '@/app/ui/metadata-line';
import { InlineEditWrapper } from '@tet/ui';
import { ReactElement, useState } from 'react';
import { useConseillerReferent } from './use-conseiller-referent';

export const ConseillerReferentItem = ({
  hideSeparator,
}: {
  hideSeparator?: boolean;
}): ReactElement => {
  const {
    conseillers,
    referents,
    areConseillersLoading,
    isReadOnly,
    isMutating,
    saveConseillers,
  } = useConseillerReferent();

  const [isOpen, setIsOpen] = useState(false);

  const names = referents
    .map((membre) => [membre.prenom, membre.nom].filter(Boolean).join(' '))
    .filter(Boolean)
    .join(', ');

  const isInteractive = !isReadOnly && conseillers.length > 0;

  return (
    <InlineEditWrapper
      disabled={!isInteractive || isMutating}
      openState={{ isOpen, setIsOpen }}
      renderOnEdit={({ openState }) => (
        <ReferentsDropdown
          buttonClassName="border-none"
          membres={conseillers}
          onChange={({ values }) =>
            saveConseillers((values ?? []).map(String))
          }
          openState={openState}
        />
      )}
    >
      <MetadataItem
        interactive={isInteractive}
        hideSeparator={hideSeparator}
        icon="user-star-line"
        label={appLabels.membreTeteFonctionConseiller}
        value={
          areConseillersLoading
            ? appLabels.chargement
            : names || <i>{appLabels.nonRenseigne}</i>
        }
      />
    </InlineEditWrapper>
  );
};
