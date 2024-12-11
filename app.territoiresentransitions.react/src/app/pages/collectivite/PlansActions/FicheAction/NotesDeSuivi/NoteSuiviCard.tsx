import { FicheActionNote } from '@/api/plan-actions';
import { Button, Card, Icon } from '@/ui';
import { format } from 'date-fns';
import { useState } from 'react';
import { DeletedNote, EditedNote } from '../data/useUpsertNoteSuivi';
import ModaleEditionNote from './ModaleEditionNote';
import ModaleSuppressionNote from './ModaleSuppressionNote';

type NoteSuiviCardProps = {
  isReadonly?: boolean;
  note: FicheActionNote;
  onEdit: (editedNote: EditedNote) => void;
  onDelete: (deletedNote: DeletedNote) => void;
};

const NoteSuiviCard = ({
  isReadonly,
  note,
  onEdit,
  onDelete,
}: NoteSuiviCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const year = new Date(note.dateNote).getFullYear();

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
                onEdit={onEdit}
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
        <span>{year}</span>

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
          {note.modifiedAt && note.modifiedAt !== note.createdAt && (
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
