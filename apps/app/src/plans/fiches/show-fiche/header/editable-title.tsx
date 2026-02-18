import { cn, InlineEditWrapper, TableCellTextarea } from '@tet/ui';
import { useState } from 'react';

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
  return (
    <InlineEditWrapper
      floatingMatchReferenceHeight={false}
      disabled={isReadonly}
      onClose={() => setTitle(title)}
      renderOnEdit={({ openState }) => (
        <TableCellTextarea
          dataTest={dataTest}
          value={title ?? undefined}
          autoFocus
          onChange={(evt) => setTitle(evt.target.value)}
          placeholder="Saisir un titre"
          onBlur={() => {
            onUpdate(title);
            openState.setIsOpen(false);
          }}
          onKeyDown={(evt) => {
            if (evt.key === 'Enter') {
              onUpdate(title);
              openState.setIsOpen(false);
            }
          }}
          className={inputClassName}
          rows={1}
        />
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
