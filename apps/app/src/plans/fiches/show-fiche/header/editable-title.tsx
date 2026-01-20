import { Button, cn, Input } from '@tet/ui';
import { useEffect, useState } from 'react';

type EditableTitleProps = {
  className?: string;
  containerClassName?: string;
  title: string | null;
  isReadonly: boolean;
  onUpdate: (value: string | null) => void;
};

export const EditableTitle = ({
  className,
  containerClassName,
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
      className={cn(
        'w-full flex justify-between items-start mb-2 group cursor-text',
        containerClassName
      )}
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
          className={cn('text-3xl', className)}
          icon={{
            buttonProps: {
              icon: 'save-3-fill',
              onClick: handleChangeMode,
              title: 'Sauvegarder',
            },
          }}
        />
      ) : (
        <h1 className={cn('mt-1.5 mb-2', className)}>
          {editedTitle ?? 'Sans titre'}
        </h1>
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
