'use client';

import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import { appLabels } from '@/app/labels/catalog';
import { ActionId } from '@tet/domain/referentiels';
import { cn, Icon, IconValue, InlineEditWrapper } from '@tet/ui';
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

  const displayValue = arePilotesLoading ? appLabels.chargement : pilotesNoms;

  return (
    <div className="flex items-center">
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 rounded px-2 -mx-2',
          !isReadOnly && 'hover:bg-grey-3'
        )}
      >
        <Icon icon={icon} />
        <span className="font-normal">{label({ count: pilotes.length })}</span>
        <InlineEditWrapper
          disabled={isReadOnly || isMutating}
          openState={{ isOpen, setIsOpen }}
          renderOnEdit={({ openState }) => (
            <div className="w-72">
              <PersonneTagDropdown
                inlineEdit
                values={pilotes.map(getPersonneStringId)}
                onChange={({ personnes }) => saveRoleMesure(personnes)}
                openState={openState}
              />
            </div>
          )}
        >
          {(props) => (
            <button type="button" {...props}>
              {displayValue ? (
                <span className="font-medium">{displayValue}</span>
              ) : (
                <span className="text-warning-1">
                  {appLabels.aCompleterMaj}
                </span>
              )}
            </button>
          )}
        </InlineEditWrapper>
      </div>
      {!hideSeparator && <div className="ml-4 w-[1px] h-4 bg-primary-3" />}
    </div>
  );
};
