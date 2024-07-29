import {useState} from 'react';
import EmptyCard from '../../EmptyCard';
import NotesPicto from './NotesPicto';
import CarteNote from './CarteNote';
import ModaleCreationNote from './ModaleCreationNote';

type NotesComplementairesProps = {
  isReadonly: boolean;
  notes: string | null;
  updateNotes: (notes: string | null) => void;
};

const NotesComplementaires = ({
  isReadonly,
  notes,
  updateNotes,
}: NotesComplementairesProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isEmpty = !notes;

  return (
    <>
      {isEmpty ? (
        <EmptyCard
          picto={className => <NotesPicto className={className} />}
          title="Aucune note complémentaire ajoutée"
          isReadonly={isReadonly}
          action={{
            label: 'Ajouter une note',
            onClick: () => setIsModalOpen(true),
          }}
        />
      ) : (
        <div className="bg-white border border-grey-3 rounded-lg py-7 lg:py-8 px-5 lg:px-6 xl:px-7 flex flex-col gap-5">
          {/* Titre et bouton d'édition */}
          <div className="flex justify-between">
            <h5 className="text-primary-8 mb-0">Notes complémentaires</h5>
            {/* Décommenter le bouton au passage à notes privées */}
            {/* {!isReadonly && (
              <Button
                icon="edit-box-line"
                size="xs"
                variant="outlined"
                onClick={() => setIsModalOpen(true)}
              >
                Ajouter une note
              </Button>
            )} */}
          </div>

          {/* Note complémentaire */}
          <CarteNote
            isReadonly={isReadonly}
            notes={notes}
            updateNotes={updateNotes}
          />
        </div>
      )}

      <ModaleCreationNote
        isOpen={isModalOpen && !isReadonly}
        setIsOpen={setIsModalOpen}
        updateNotes={updateNotes}
      />
    </>
  );
};

export default NotesComplementaires;
