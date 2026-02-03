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

export const EditableTitle = ({
  dataTest,
  className,
  inputClassName,
  title: initialTitle,
  isReadonly,
  onUpdate,
}: EditableTitleProps) => {
  const [title, setTitle] = useState(initialTitle);
  const updateOrFallback = (value: string | null) => {
    const TITLE_FALLBACK = 'Sans titre';
    if (value === null || value.trim() === '') {
      setTitle(TITLE_FALLBACK);
    } else {
      setTitle(value);
    }
  };
  return (
    <InlineEditWrapper
      floatingMatchReferenceHeight={false}
      disabled={isReadonly}
      onClose={() => updateOrFallback(title)}
      renderOnEdit={({ openState }) => (
        <TableCellTextarea
          dataTest={dataTest}
          value={title ?? undefined}
          autoFocus
          onChange={(evt) => setTitle(evt.target.value)}
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
        {title}
      </h1>
    </InlineEditWrapper>
  );
};
