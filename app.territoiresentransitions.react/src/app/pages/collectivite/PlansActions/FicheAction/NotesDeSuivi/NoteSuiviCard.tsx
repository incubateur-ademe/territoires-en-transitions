import { format } from 'date-fns';
import { Button, Card, Icon } from '@tet/ui';
import ModaleSuppressionNote from './ModaleSuppressionNote';
import ModaleEditionNote from './ModaleEditionNote';
import { useState } from 'react';

type NoteSuiviCardProps = {
  isReadonly?: boolean;
  note: {
    id: string;
    note: string;
    year: number;
    createdAt: string;
    createdBy: string;
    modifiedAt?: string;
    modifiedBy?: string;
  };
  onEdit: (editedNote: {
    id: string;
    note: string;
    year: number;
    createdAt: string;
    createdBy: string;
    modifiedAt?: string;
    modifiedBy?: string;
  }) => void;
  onDelete: () => void;
};

const NoteSuiviCard = ({
  isReadonly,
  note,
  onEdit,
  onDelete,
}: NoteSuiviCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="relative group">
      <div className="invisible group-hover:visible absolute top-4 right-4 flex gap-2">
        {!isReadonly && (
          <>
            <Button
              icon="edit-line"
              title="Modifier la note"
              variant="grey"
              size="xs"
              onClick={() => setIsModalOpen(true)}
            />
            {!isReadonly && isModalOpen && (
              <ModaleEditionNote
                editedNote={note}
                updateNotes={onEdit}
                isOpen={isModalOpen}
                setIsOpen={setIsModalOpen}
              />
            )}
            <ModaleSuppressionNote editedNote={note} onDelete={onDelete} />
          </>
        )}
      </div>

      <Card className="h-full px-4 py-[1.125rem] !gap-3 text-grey-8 hover:border-primary-3 hover:!bg-primary-1 !shadow-none transition">
        {/* Année */}
        <span>{note.year}</span>

        {/* Contenu de la note */}
        <p className="paragraphe-14 mb-0 whitespace-pre-wrap">{note.note}</p>

        {/* Auteurs et dates */}
        <div className="flex gap-2">
          {/* Création */}
          <span className="text-grey-8 text-sm font-normal">
            <Icon icon="user-line" size="sm" className="mr-1" />
            Créée par {note.createdBy} le{' '}
            {format(new Date(note.createdAt), 'dd/MM/yyyy')}
          </span>
          {/* Edition */}
          {(note.modifiedAt || note.modifiedBy) && (
            <>
              <div className="w-[1px] h-4 bg-grey-5" />
              <span className="text-grey-8 text-sm font-normal">
                <Icon icon="edit-line" size="sm" className="mr-1" />
                Modifiée{note.modifiedBy ? ` par ${note.modifiedBy}` : ''}
                {note.modifiedAt
                  ? ` le ${format(new Date(note.modifiedAt), 'dd/MM/yyyy')}`
                  : ''}
              </span>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default NoteSuiviCard;
