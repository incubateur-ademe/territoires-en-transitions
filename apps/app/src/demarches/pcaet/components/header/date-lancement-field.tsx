import { appLabels } from '@/app/labels/catalog';
import { MetadataItem } from '@/app/ui/metadata-line';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import { Input, InlineEditWrapper } from '@tet/ui';
import { format } from 'date-fns';
import { JSX } from 'react';

export const DateLancementField = ({
  dateLancement,
  disabled,
  onChange,
}: {
  dateLancement: string | null;
  disabled: boolean;
  onChange: (dateLancement: string | null) => void;
}): JSX.Element => {
  const date = dateLancement ? new Date(dateLancement) : null;

  return (
    <InlineEditWrapper
      disabled={disabled}
      renderOnEdit={({ openState }) => (
        <Input
          type="date"
          min="1900-01-01"
          max="2100-01-01"
          autoFocus
          value={date ? format(date, 'yyyy-MM-dd') : ''}
          onChange={(e) =>
            onChange(
              e.target.value ? new Date(e.target.value).toISOString() : null
            )
          }
          onKeyDown={(evt) => {
            if (evt.key === 'Enter' || evt.key === 'Escape') {
              openState.setIsOpen(false);
            }
          }}
        />
      )}
    >
      <MetadataItem
        interactive={!disabled}
        icon="calendar-event-line"
        label={appLabels.demarchePcaetHeaderDateLancement}
        value={
          date ? getTextFormattedDate({ date: format(date, 'yyyy-MM-dd') }) : ''
        }
      />
    </InlineEditWrapper>
  );
};
