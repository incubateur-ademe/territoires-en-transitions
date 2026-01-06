import { useFicheContext } from '@/app/plans/fiches/show-fiche/context/fiche-context';
import { FicheNoteUpsert } from '@tet/domain/plans';
import { Button, EmptyCard } from '@tet/ui';
import { useState } from 'react';
import { NoteCreationModal } from './note-creation.modal';
import NoteCard from './note.card';
import NotificationPicto from './notification.picto';

export const NotesView = () => {
  const { fiche, isReadonly, update } = useFicheContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const notes = fiche.notes || [];
  const isEmpty = notes.length === 0;

  const updateNote = (note: FicheNoteUpsert) => {
    update({
      ficheId: fiche.id,
      ficheFields: {
        notes: [...notes, note],
      },
    });
  };
  const deleteNote = (noteId: number) => {
    update({
      ficheId: fiche.id,
      ficheFields: {
        notes: notes.filter((note) => note.id !== noteId),
      },
    });
  };
  return (
    <>
      {isEmpty ? (
        <EmptyCard
          picto={(props) => <NotificationPicto {...props} />}
          title="Aucune note n'est renseignée"
          isReadonly={isReadonly}
          actions={[
            {
              children: 'Compléter le suivi',
              onClick: () => setIsModalOpen(true),
            },
          ]}
          size="xs"
        />
      ) : (
        <div className="bg-white border border-grey-3 rounded-lg py-7 lg:py-8 xl:py-10 px-5 lg:px-6 xl:px-8 flex flex-col gap-5">
          <div className="flex justify-between">
            <h5 className="text-primary-8 mb-0">Notes</h5>
            {!isReadonly && (
              <Button
                icon="add-line"
                size="xs"
                variant="outlined"
                onClick={() => setIsModalOpen(true)}
              >
                Ajouter une note
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {notes
              .sort(
                (a, b) =>
                  new Date(b.dateNote).getTime() -
                  new Date(a.dateNote).getTime()
              )
              .map((note, index) => (
                <NoteCard
                  key={`${note.dateNote}-${index}`}
                  fiche={fiche}
                  note={note}
                  onEdit={updateNote}
                  onDelete={(id) => {
                    deleteNote(id);
                  }}
                />
              ))}
          </div>
        </div>
      )}

      {!isReadonly && isModalOpen && (
        <NoteCreationModal
          fiche={fiche}
          isOpen={isModalOpen && !isReadonly}
          setIsOpen={setIsModalOpen}
          onEdit={updateNote}
        />
      )}
    </>
  );
};
