import { useState } from 'react';
import { useFicheContext } from '../../context/fiche-context';
import { ContentLayout } from '../content-layout';
import { NoteCreationModal } from './note-creation.modal';
import { NotesTable } from './notes.table';
import NotificationPicto from './notification.picto';

export const NotesView = () => {
  const { fiche, isReadonly, notes } = useFicheContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
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
            onUpsertNote={notes.upsert}
            onDeleteNote={notes.delete}
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
    </>
  );
};
