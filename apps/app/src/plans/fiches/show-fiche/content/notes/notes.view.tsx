import { useState } from 'react';
import { useFicheContext } from '../../context/fiche-context';
import { ContentLayout } from '../content-layout';
import { NoteCreationModal } from './note-creation.modal';
import { NoteEditionModal } from './note-edition.modal';
import { NotesTable } from './notes.table';
import NotificationPicto from './notification.picto';

export const NotesView = () => {
  const { fiche, isReadonly, notes } = useFicheContext();
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const editingNote = notes.list.find((note) => note.id === editingNoteId);
  return (
    <>
      <ContentLayout.Root>
        <ContentLayout.Empty
          isReadonly={isReadonly}
          picto={(props) => <NotificationPicto {...props} />}
          title="Aucune note n'est renseignée"
          actions={[
            {
              children: 'Ajouter une note',
              onClick: () => setIsModalOpen(true),
            },
          ]}
        />
        <ContentLayout.Content data={notes.list}>
          <NotesTable
            notes={notes.list || []}
            fiche={fiche}
            isReadonly={isReadonly}
            onCreateNote={notes.upsert}
            onDeleteNote={notes.delete}
            onSetEditingNoteId={setEditingNoteId}
          />
        </ContentLayout.Content>
      </ContentLayout.Root>
      {!isReadonly && isModalOpen && (
        <NoteCreationModal
          fiche={fiche}
          isOpen={isModalOpen}
          setIsOpen={setIsModalOpen}
          onEdit={notes.upsert}
        />
      )}
      {editingNote && (
        <NoteEditionModal
          key={editingNote.id}
          fiche={fiche}
          editedNote={editingNote}
          onEdit={notes.upsert}
          isOpen={editingNote !== undefined}
          setIsOpen={(isOpen) => {
            if (!isOpen) {
              setEditingNoteId(null);
            }
          }}
        />
      )}
    </>
  );
};
