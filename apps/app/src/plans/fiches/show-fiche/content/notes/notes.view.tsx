import { Button, VisibleWhen } from '@tet/ui';
import { useState } from 'react';
import { useFicheContext } from '../../context/fiche-context';
import { LinkedResources } from '../linked-resources-layout';
import { NoteCreationModal } from './note-creation.modal';
import NoteCard from './note.card';
import NotificationPicto from './notification.picto';

export const NotesView = () => {
  const { fiche, isReadonly, notes } = useFicheContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sortedNotes = notes.list
    ? [...notes.list].sort(
        (a, b) =>
          new Date(b.dateNote).getTime() - new Date(a.dateNote).getTime()
      )
    : [];

  return (
    <>
      <LinkedResources.Root>
        <LinkedResources.Empty
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
        <LinkedResources.Content
          data={sortedNotes}
          isLoading={notes.isLoading}
          actions={
            <VisibleWhen condition={!isReadonly}>
              <Button
                icon="add-line"
                size="xs"
                variant="outlined"
                onClick={() => setIsModalOpen(true)}
              >
                Ajouter une note
              </Button>
            </VisibleWhen>
          }
        >
          {(note) => (
            <NoteCard
              key={`${note.dateNote}-${note.id}`}
              fiche={fiche}
              note={note}
              onEdit={notes.upsert}
              onDelete={notes.delete}
            />
          )}
        </LinkedResources.Content>
      </LinkedResources.Root>

      {!isReadonly && isModalOpen && (
        <NoteCreationModal
          fiche={fiche}
          isOpen={isModalOpen && !isReadonly}
          setIsOpen={setIsModalOpen}
          onEdit={notes.upsert}
        />
      )}
    </>
  );
};
