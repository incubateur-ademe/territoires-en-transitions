import { cn, InlineEditWrapper, Input } from '@tet/ui';
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
  const [editedTitle, setEditedTitle] = useState(initialTitle);
  return (
    <InlineEditWrapper
      disabled={isReadonly}
      onClose={() => onUpdate(editedTitle)}
      renderOnEdit={({ openState }) => (
        <div className="w-full" data-test={dataTest}>
          <Input
            value={editedTitle ?? ''}
            autoFocus
            onChange={(evt) => setEditedTitle(evt.target.value)}
            onBlur={() => {
              onUpdate(editedTitle);
              openState.setIsOpen(false);
            }}
            onKeyDown={(evt) => {
              if (evt.key === 'Enter') {
                onUpdate(editedTitle);
                openState.setIsOpen(false);
              }
            }}
            type="text"
            containerClassname="w-full"
            className={cn('text-3xl', inputClassName)}
          />
        </div>
      )}
    >
      <h1 data-test={dataTest} className={cn('mb-0', className)}>
        {initialTitle ?? 'Sans titre'}
      </h1>
    </InlineEditWrapper>
  );
};
