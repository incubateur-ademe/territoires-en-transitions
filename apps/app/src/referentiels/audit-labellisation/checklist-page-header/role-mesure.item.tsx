'use client';

import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import { appLabels } from '@/app/labels/catalog';
import { MetadataItem } from '@/app/ui/metadata-line';
import { ActionId } from '@tet/domain/referentiels';
import { IconValue, InlineEditWrapper } from '@tet/ui';
import { ReactElement } from 'react';
import { useRoleDropdown } from '../checklist.context';
import { useRoleMesure } from './use-role-mesure';

export const RoleMesureItem = ({
  actionId,
  icon,
  label,
  hideSeparator,
}: {
  actionId: ActionId;
  icon: IconValue;
  label: (params: { count: number }) => string;
  hideSeparator?: boolean;
}): ReactElement => {
  const { pilotes, arePilotesLoading, isReadOnly, isMutating, saveRoleMesure } =
    useRoleMesure(actionId);

  const { activeActionId, openDropdown, closeDropdown } = useRoleDropdown();
  const isOpen = activeActionId === actionId;
  const setIsOpen = (open: boolean): void =>
    open ? openDropdown(actionId) : closeDropdown();

  const pilotesNoms = pilotes
    .map((p) => p.nom)
    .filter(Boolean)
    .join(', ');

  return (
    <InlineEditWrapper
      disabled={isReadOnly || isMutating}
      openState={{ isOpen, setIsOpen }}
      renderOnEdit={({ openState }) => (
        <PersonneTagDropdown
          buttonClassName="border-none"
          values={pilotes.map(getPersonneStringId)}
          onChange={({ personnes }) => saveRoleMesure(personnes)}
          openState={openState}
        />
      )}
    >
      <MetadataItem
        interactive={!isReadOnly}
        hideSeparator={hideSeparator}
        icon={icon}
        label={label({ count: pilotes.length })}
        value={arePilotesLoading ? appLabels.chargement : pilotesNoms || null}
      />
    </InlineEditWrapper>
  );
};
