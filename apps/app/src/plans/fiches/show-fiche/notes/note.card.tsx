import { FicheNote, FicheWithRelations } from '@tet/domain/plans';
import { Button, Card, Icon, RichTextEditor } from '@tet/ui';
import { format } from 'date-fns';
import { useState } from 'react';
import { DeletedNote } from '../data/use-delete-note';
import { EditedNote } from '../data/use-upsert-note';
import { NoteDeletionModal } from './note-deletion.modal';
import { NoteEditionModal } from './note-edition.modal';

type NoteSuiviCardProps = {
  fiche: FicheWithRelations;
  note: FicheNote;
  onEdit: (editedNote: EditedNote) => void;
  onDelete: (deletedNote: DeletedNote) => void;
};

const NoteCard = ({ fiche, note, onEdit, onDelete }: NoteSuiviCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const year = new Date(note.dateNote).getFullYear();

  return (
    <div className="relative group">
      <div className="invisible group-hover:visible absolute top-4 right-4 flex gap-2">
        <>
          <Button
            icon="edit-line"
            title="Modifier la note"
            variant="grey"
            size="xs"
            onClick={() => setIsModalOpen(true)}
          />
          {isModalOpen && (
            <NoteEditionModal
              fiche={fiche}
              editedNote={note}
              onEdit={onEdit}
              isOpen={isModalOpen}
              setIsOpen={setIsModalOpen}
            />
          )}
          <NoteDeletionModal
            fiche={fiche}
            editedNote={note}
            onDelete={onDelete}
          />
        </>
      </div>

      <Card className="h-full px-4 py-[1.125rem] !gap-3 text-grey-8 hover:border-primary-3 hover:!bg-primary-1 !shadow-none transition">
        <span>{year}</span>

        <RichTextEditor
          disabled
          className="border-none !px-0 !bg-transparent"
          initialValue={note.note}
        />

        <div className="flex gap-2">
          <span className="text-grey-8 text-sm font-normal">
            <Icon icon="user-line" size="sm" className="mr-1" />
            Créée par {note.createdBy} le{' '}
            {format(new Date(note.createdAt), 'dd/MM/yyyy')}
          </span>
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

export default NoteCard;
