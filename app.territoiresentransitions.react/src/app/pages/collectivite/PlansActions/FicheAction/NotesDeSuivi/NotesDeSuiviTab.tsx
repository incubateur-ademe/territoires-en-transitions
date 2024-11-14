import { useState } from 'react';
import { Button } from '@tet/ui';
import { FicheAction } from '@tet/api/plan-actions';
import EmptyCard from '../EmptyCard';
import NotificationPicto from './NotificationPicto';
import ModaleCreationNote from './ModaleCreationNote';
import NoteSuiviCard from './NoteSuiviCard';
import {
  useDeleteNoteSuivi,
  useUpsertNoteSuivi,
} from '../data/useUpsertNoteSuivi';

type NotesDeSuiviTabProps = {
  isReadonly: boolean;
  fiche: FicheAction;
};

const NotesDeSuiviTab = ({ fiche, isReadonly }: NotesDeSuiviTabProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { mutate: updateNotes } = useUpsertNoteSuivi(fiche.id);
  const { mutate: deleteNote } = useDeleteNoteSuivi(fiche.id);

  const notes = fiche.notesSuivi || [];
  const isEmpty = notes.length === 0;

  return (
    <>
      {isEmpty ? (
        <EmptyCard
          picto={(className) => <NotificationPicto className={className} />}
          title="Aucune note de suivi ou point de vigilance n'est renseigné"
          isReadonly={isReadonly}
          action={{
            label: 'Compléter le suivi',
            onClick: () => setIsModalOpen(true),
          }}
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
            {notes.map((note) => (
              <NoteSuiviCard
                key={note.dateNote}
                note={note}
                onEdit={updateNotes}
                onDelete={deleteNote}
              />
            ))}
          </div>
        </div>
      )}

      {!isReadonly && isModalOpen && (
        <ModaleCreationNote
          isOpen={isModalOpen && !isReadonly}
          setIsOpen={setIsModalOpen}
          onEdit={updateNotes}
        />
      )}
    </>
  );
};

export default NotesDeSuiviTab;
