import { MetadataNoteView } from '@/app/plans/fiches/show-fiche/content/notes/metadata-note.view';
import { FicheNote, FicheWithRelations } from '@tet/domain/plans';
import { Button, Card, RichTextEditor } from '@tet/ui';
import { useState } from 'react';
import { NoteDeletionModal } from './note-deletion.modal';
import { NoteEditionModal } from './note-edition.modal';

type NoteCardProps = {
  isReadonly?: boolean;
  fiche: FicheWithRelations;
  note: FicheNote;
  onEdit: (editedNote: { id?: number; note: string; dateNote: number }) => void;
  onDelete: (noteToDeleteId: number) => void;
};

const NoteCard = ({
  isReadonly,
  fiche,
  note,
  onEdit,
  onDelete,
}: NoteCardProps) => {
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
        )}
      </div>

      <Card className="h-full px-4 py-[1.125rem] !gap-3 text-grey-8 hover:border-primary-3 hover:!bg-primary-1 !shadow-none transition">
        <span>{year}</span>

        <RichTextEditor
          disabled
          className="border-none !px-0 !bg-transparent"
          initialValue={note.note}
        />
        <div className="flex justify-end items-end flex-col align-bottom font-normal text-sm">
          <MetadataNoteView note={note} />
        </div>
      </Card>
    </div>
  );
};

export default NoteCard;
