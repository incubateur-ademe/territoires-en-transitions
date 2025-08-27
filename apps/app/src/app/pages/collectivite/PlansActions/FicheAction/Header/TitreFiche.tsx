import { Button, Input } from '@/ui';
import { useEffect, useState } from 'react';

type TitreFicheProps = {
  titre: string | null;
  isReadonly: boolean;
  updateTitle: (value: string | null) => void;
};

/**
 * Titre éditable d'une fiche action
 */
const TitreFiche = ({ titre, isReadonly, updateTitle }: TitreFicheProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(titre);

  useEffect(() => setEditedTitle(titre), [titre]);

  // Switch entre les modes lecture et édition
  // Lors du switch d'édition à lecture -> sauvegarde des modifications
  const handleChangeMode = () => {
    setIsEditing((prevState) => !prevState);
    if (isEditing) {
      const titleToSave = editedTitle?.trim() ?? null;
      if (titleToSave !== titre) {
        updateTitle(titleToSave?.length ? titleToSave : null);
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
      {/* Titre de la fiche action */}
      {isEditing ? (
        // Titre en version édition
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
        // Titre en version lecture
        <h1 className="mt-1.5 mb-2">{titre || 'Sans titre'}</h1>
      )}
      {/* Bouton d'édition du titre de la fiche action */}
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

export default TitreFiche;
