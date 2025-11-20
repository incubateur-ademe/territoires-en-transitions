import { Button, EmptyCard } from '@tet/ui';
import { useState } from 'react';
import { Fiche } from '../data/use-get-fiche';
import { useFicheActionNotesSuivi } from '../data/useFicheActionNotesSuivi';
import {
  useDeleteNoteSuivi,
  useUpsertNoteSuivi,
} from '../data/useUpsertNoteSuivi';
import ModaleCreationNoteDeSuivi from './ModaleCreationNoteDeSuivi';
import NoteSuiviCard from './NoteSuiviCard';
import NotificationPicto from './NotificationPicto';

type NotesDeSuiviTabProps = {
  isReadonly: boolean;
  fiche: Fiche;
};

const NotesDeSuiviTab = ({ fiche, isReadonly }: NotesDeSuiviTabProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { mutate: updateNotes } = useUpsertNoteSuivi(fiche);
  const { mutate: deleteNote } = useDeleteNoteSuivi(fiche);
  const { data: notesSuivi } = useFicheActionNotesSuivi(fiche);

  const notes = notesSuivi || [];
  const isEmpty = notes.length === 0;

  return (
    <>
      {isEmpty ? (
        <EmptyCard
          picto={(props) => <NotificationPicto {...props} />}
          title="Aucune note de suivi ou point de vigilance n'est renseigné"
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
          {/* Titre et bouton d'édition */}
          <div className="flex justify-between">
            <h5 className="text-primary-8 mb-0">
              Notes de suivi et points de vigilance
            </h5>
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
            {notes.map((note, index) => (
              <NoteSuiviCard
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
        <ModaleCreationNoteDeSuivi
          fiche={fiche}
          isOpen={isModalOpen && !isReadonly}
          setIsOpen={setIsModalOpen}
          onEdit={updateNotes}
        />
      )}
    </>
  );
};

export default NotesDeSuiviTab;
