import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { Personne } from '@tet/domain/collectivites';
import { IconValue, InlineEditWrapper } from '@tet/ui';
import { ReactNode } from 'react';
import { MetadataItem } from './metadata-item';

export const MetadataItemPersonne = ({
  dataTest,
  icon,
  hideSeparator,
  isReadOnly,
  label,
  emptyLabel,
  compact = false,
  personnes,
  onChange,
  openState,
  tooltip,
}: {
  dataTest?: string;
  icon: IconValue;
  hideSeparator?: boolean;
  isReadOnly: boolean;
  label: { one: string; many: string };
  emptyLabel?: string;
  compact?: boolean;
  personnes: Personne[];
  onChange: (personnes: Personne[]) => void;
  openState?: { isOpen: boolean; setIsOpen: (v: boolean) => void };
  tooltip?: ReactNode;
}) => {
  const noms = personnes
    .map((p) => p.userName || p.tagName || '')
    .filter(Boolean);

  return (
    <InlineEditWrapper
      disabled={isReadOnly}
      renderOnEdit={({ openState: internalOpenState }) => {
        return (
          <PersonneTagDropdown
            dataTest={dataTest ? `${dataTest}-dropdown` : undefined}
            buttonClassName="border-none"
            values={personnes
              ?.map((p) => p.userId || p.tagId?.toString() || '')
              .filter(Boolean)}
            onChange={({ personnes: selected }) =>
              onChange(
                selected.map((p) => ({
                  tagId: p.tagId,
                  userId: p.userId,
                  tagName: p.tagId ? p.nom : null,
                  userName: p.userId ? p.nom : null,
                }))
              )
            }
            openState={openState ?? internalOpenState}
          />
        );
      }}
    >
      <MetadataItem
        dataTest={dataTest}
        interactive={!isReadOnly}
        hideSeparator={hideSeparator}
        tooltip={tooltip}
        icon={icon}
        label={personnes.length > 1 ? label.many : label.one}
        emptyLabel={emptyLabel}
        value={
          !noms.length ? null : compact ? (
            <ListWithTooltip list={noms} />
          ) : (
            noms.join(', ')
          )
        }
      />
    </InlineEditWrapper>
  );
};
