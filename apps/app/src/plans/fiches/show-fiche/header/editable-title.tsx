import { cn, InlineEditWrapper, TableCellTextarea } from '@tet/ui';
import { useState } from 'react';

export const TITLE_MAX_LENGTH = 300;

const TitleLengthHint = ({ currentLength }: { currentLength: number }) => {
  return (
    <span className="text-xs text-grey-6 px-4 py-1">
      {`${currentLength} / ${TITLE_MAX_LENGTH} caractères`}
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

  return (
    <InlineEditWrapper
      floatingMatchReferenceHeight={false}
      disabled={isReadonly}
      onClose={() => {
        onUpdate(title);
      }}
      renderOnEdit={({ openState }) => (
        <div className="flex flex-col gap-1">
          <TableCellTextarea
            dataTest={dataTest}
            value={title ?? undefined}
            autoFocus
            onChange={(evt) =>
              setTitle(evt.target.value.slice(0, TITLE_MAX_LENGTH))
            }
            placeholder="Saisir un titre"
            onBlur={() => {
              openState.setIsOpen(false);
            }}
            onKeyDown={(evt) => {
              if (evt.key === 'Enter') {
                openState.setIsOpen(false);
              }
            }}
            className={inputClassName}
            rows={1}
          />
          <TitleLengthHint currentLength={titleLength} />
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
