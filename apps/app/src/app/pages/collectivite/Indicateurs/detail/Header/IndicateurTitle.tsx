import { Button, Input } from '@/ui';
import classNames from 'classnames';
import { useEffect, useState } from 'react';

type Props = {
  title: string;
  unite: string;
  composeSansAgregation: boolean;
  isReadonly: boolean;
  updateTitle: (value: string) => void;
  isSticky: boolean;
};

/**
 * Titre éditable d'un indicateur
 */
const IndicateurTitle = ({
  title,
  unite,
  composeSansAgregation,
  isReadonly,
  updateTitle,
  isSticky,
}: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);

  useEffect(() => setEditedTitle(title), [title]);

  // Switch entre les modes lecture et édition
  // Lors du switch d'édition à lecture -> sauvegarde des modifications
  const handleChangeMode = () => {
    setIsEditing((prevState) => !prevState);
    if (isEditing) {
      const titleToSave = editedTitle?.trim();
      if (titleToSave !== title.trim()) {
        updateTitle(titleToSave);
        setEditedTitle(titleToSave);
      }
    }
  };

  return (
    <div
      className="w-full flex justify-between items-start group cursor-text"
      data-test="TitreFiche"
      onClick={() => !isReadonly && !isEditing && handleChangeMode()}
    >
      {/* Titre de l'indicateur */}
      {isEditing && !isSticky ? (
        // Titre en version édition
        <Input
          value={editedTitle}
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
        // Titre en version lecture
        <h1
          className={classNames('mb-0 text-4xl', {
            '!text-2xl leading-tight': isSticky,
          })}
        >
          {title || 'Sans titre'}{' '}
          {!composeSansAgregation && (
            <sup className="text-grey-6 font-medium">({unite})</sup>
          )}
        </h1>
      )}
      {/* Bouton d'édition du titre de la fiche action */}
      {!isEditing && !isSticky && !isReadonly && (
        <Button
          icon="edit-line"
          variant="grey"
          size="xs"
          className="mt-2 invisible group-hover:visible"
          onClick={handleChangeMode}
        />
      )}
    </div>
  );
};

export default IndicateurTitle;
