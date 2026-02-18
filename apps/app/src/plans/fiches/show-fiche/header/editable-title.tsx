import { getFormattedNumber } from '@/app/utils/formatUtils';
import { cn, InlineEditWrapper, TableCellTextarea } from '@tet/ui';
import { useState } from 'react';

export const TITLE_MAX_LENGTH = 300;

type TitleLengthHintProps = {
  currentLength: number;
  maxLength: number;
};

const TitleLengthHint = ({
  currentLength,
  maxLength,
}: TitleLengthHintProps) => {
  const isTooLong = currentLength > maxLength;
  return (
    <span
      className={cn('text-xs text-grey-6 px-4 py-1', {
        'text-red-400': isTooLong,
      })}
    >
      {isTooLong
        ? `Le titre ne peut pas dépasser ${getFormattedNumber(
            maxLength
          )} caractères.`
        : `${currentLength} / ${getFormattedNumber(maxLength)} caractères`}
    </span>
  );
};

type EditableTitleProps = {
  dataTest?: string;
  className?: string;
  inputClassName?: string;
  title: string | null;
  isReadonly: boolean;
  onUpdate: (value: string | null) => void;
};

const TITLE_FALLBACK = 'Sans titre';

export const EditableTitle = ({
  dataTest,
  className,
  inputClassName,
  title: initialTitle,
  isReadonly,
  onUpdate,
}: EditableTitleProps) => {
  const [title, setTitle] = useState(initialTitle);

  const titleLength = (title ?? '').length;
  const isTitleTooLong = titleLength > TITLE_MAX_LENGTH;

  return (
    <InlineEditWrapper
      floatingMatchReferenceHeight={false}
      disabled={isReadonly}
      onClose={() => setTitle(title)}
      renderOnEdit={({ openState }) => (
        <div className="flex flex-col gap-1">
          <TableCellTextarea
            dataTest={dataTest}
            value={title ?? undefined}
            autoFocus
            onChange={(evt) => setTitle(evt.target.value)}
            placeholder="Saisir un titre"
            onBlur={() => {
              if (!isTitleTooLong) {
                onUpdate(title);
                openState.setIsOpen(false);
              }
            }}
            onKeyDown={(evt) => {
              if (evt.key === 'Enter') {
                if (!isTitleTooLong) {
                  onUpdate(title);
                  openState.setIsOpen(false);
                }
              }
            }}
            className={inputClassName}
            rows={1}
          />
          <TitleLengthHint
            currentLength={titleLength}
            maxLength={TITLE_MAX_LENGTH}
          />
        </div>
      )}
    >
      <h1
        data-test={dataTest}
        className={cn('mb-0 text-[2rem] leading-tight', className)}
      >
        {title || TITLE_FALLBACK}
      </h1>
    </InlineEditWrapper>
  );
};
