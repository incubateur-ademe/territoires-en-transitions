import { FicheWithRelations } from '@tet/domain/plans';
import { Button, EmptyCard } from '@tet/ui';
import { useState } from 'react';
import { useDeleteNote } from '../data/use-delete-note';
import { useGetFicheNotes } from '../data/use-get-fiche-notes';
import { useUpsertNote } from '../data/use-upsert-note';
import { NoteCreationModal } from './note-creation.modal';
import NoteCard from './note.card';
import NotificationPicto from './notification.picto';

type NotesViewProps = {
  isReadonly: boolean;
  fiche: FicheWithRelations;
};

export const NotesView = ({ fiche, isReadonly }: NotesViewProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { mutate: updateNotes } = useUpsertNote(fiche);
  const { mutate: deleteNote } = useDeleteNote(fiche);
  const { data: notesData } = useGetFicheNotes(fiche);

  const notes = notesData || [];
  const isEmpty = notes.length === 0;

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
                  onEdit={updateNotes}
                  onDelete={deleteNote}
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
          onEdit={updateNotes}
        />
      )}
    </>
  );
};
