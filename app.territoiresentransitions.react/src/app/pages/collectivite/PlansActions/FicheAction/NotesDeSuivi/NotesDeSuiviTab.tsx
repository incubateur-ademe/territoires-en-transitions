import { useState } from 'react';
import { Button } from '@tet/ui';
import { FicheAction } from '@tet/api/plan-actions';
import EmptyCard from '../EmptyCard';
import NotificationPicto from './NotificationPicto';
import ModaleCreationNote from './ModaleCreationNote';
import NoteSuiviCard from './NoteSuiviCard';

type NotesDeSuiviTabProps = {
  isReadonly: boolean;
  fiche: FicheAction;
  updateFiche: (fiche: FicheAction) => void;
};

const NotesDeSuiviTab = ({ isReadonly }: NotesDeSuiviTabProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // TODO: récupérer les notes existantes dans la fiche
  const [notes, setNotes] = useState<
    {
      id: string;
      note: string;
      year: number;
      createdAt: string;
      createdBy: string;
      modifiedAt?: string;
      modifiedBy?: string;
    }[]
  >([]);

  // TODO: isEmtpy si notes undefined ou tableau vide
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
            {notes
              .sort((a, b) => b.year - a.year)
              .map((note) => (
                <NoteSuiviCard
                  key={note.id}
                  note={note}
                  // TODO: mettre à jour onEdit et onDelete pour mettre à jour l'objet fiche
                  onEdit={(editedNote) => {
                    setNotes((prevState) => [
                      ...prevState.filter((p) => p.id !== editedNote.id),
                      editedNote,
                    ]);
                  }}
                  onDelete={() =>
                    setNotes((prevState) =>
                      prevState.filter((s) => s.id !== note.id)
                    )
                  }
                />
              ))}
          </div>
        </div>
      )}

      {!isReadonly && isModalOpen && (
        <ModaleCreationNote
          isOpen={isModalOpen && !isReadonly}
          setIsOpen={setIsModalOpen}
          // fiche={fiche}
          // updateFiche={updateFiche}
          updateNotes={(newNote) =>
            setNotes((prevState) => [
              ...prevState,
              { ...newNote, id: `${newNote.id}-${prevState.length}` },
            ])
          }
        />
      )}
    </>
  );
};

export default NotesDeSuiviTab;
