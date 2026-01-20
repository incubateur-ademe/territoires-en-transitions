import { InlineEditWrapper, Input } from '@tet/ui';
import { useState } from 'react';

type EditableTitleProps = {
  title: string | null;
  isReadonly: boolean;
  onUpdate: (value: string | null) => void;
};

export const EditableTitle = ({
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
        <div className="w-full">
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
            className="text-3xl"
          />
        </div>
      )}
    >
      <h1 data-test="TitreFiche" className="mb-0">
        {initialTitle ?? 'Sans titre'}
      </h1>
    </InlineEditWrapper>
  );
};
