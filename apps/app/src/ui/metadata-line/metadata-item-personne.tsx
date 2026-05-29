import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import { Personne } from '@tet/domain/collectivites';
import { IconValue, InlineEditWrapper } from '@tet/ui';
import { MetadataItem } from './metadata-item';

export const MetadataItemPersonne = ({
  dataTest,
  icon,
  hideSeparator,
  isReadOnly,
  label,
  personnes,
  onChange,
  openState,
}: {
  dataTest?: string;
  icon: IconValue;
  hideSeparator?: boolean;
  isReadOnly: boolean;
  label: { one: string; many: string };
  personnes: Personne[];
  onChange: (personnes: Personne[]) => void;
  openState?: { isOpen: boolean; setIsOpen: (v: boolean) => void };
}) => {
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
            onChange={({ personnes }) => onChange(personnes)}
            openState={openState ?? internalOpenState}
          />
        );
      }}
    >
      <MetadataItem
        dataTest={dataTest}
        interactive={!isReadOnly}
        hideSeparator={hideSeparator}
        icon={icon}
        label={personnes.length > 1 ? label.many : label.one}
        value={
          personnes.length
            ? personnes
                .map((p) => p.userName || p.tagName || '')
                .filter(Boolean)
                .join(', ')
            : null
        }
      />
    </InlineEditWrapper>
  );
};
