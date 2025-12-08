import { Button, Input } from '@tet/ui';
import { useEffect, useState } from 'react';

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
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(initialTitle);

  useEffect(() => setEditedTitle(initialTitle), [initialTitle]);

  const handleChangeMode = () => {
    setIsEditing((prevState) => !prevState);
    if (isEditing) {
      const titleToSave = editedTitle?.trim() ?? null;
      if (titleToSave !== initialTitle) {
        onUpdate(titleToSave?.length ? titleToSave : null);
        setEditedTitle(titleToSave);
      }
    }
  };

  return (
    <div
      className="w-full flex justify-between items-start mb-2 group cursor-text"
      data-test="TitreFiche"
      onClick={() => !isReadonly && !isEditing && handleChangeMode()}
    >
      {isEditing ? (
        <Input
          value={editedTitle ?? ''}
          autoFocus
          onChange={(evt) => setEditedTitle(evt.target.value)}
          onBlur={handleChangeMode}
          onKeyDown={(evt) => evt.key === 'Enter' && handleChangeMode()}
          type="text"
          containerClassname="w-full"
          className="text-3xl"
          icon={{
            buttonProps: {
              icon: 'save-3-fill',
              onClick: handleChangeMode,
              title: 'Sauvegarder',
            },
          }}
        />
      ) : (
        <h1 className="mt-1.5 mb-2">{editedTitle ?? 'Sans titre'}</h1>
      )}
      {!isEditing && !isReadonly && (
        <Button
          icon="edit-line"
          variant="grey"
          size="xs"
          className="mt-3.5 invisible group-hover:visible"
          onClick={handleChangeMode}
        />
      )}
    </div>
  );
};
