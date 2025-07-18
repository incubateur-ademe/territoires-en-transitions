import { FicheShareProperties } from '@/app/plans/fiches/share-fiche/fiche-share-properties.dto';
import { FicheWithRelations } from '@/domain/plans/fiches';
import { EmptyCard } from '@/ui';
import { useState } from 'react';
import CarteNote from './CarteNote';
import ModaleCreationNote from './ModaleCreationNote';
import NotesPicto from './NotesPicto';

type NotesComplementairesProps = {
  isReadonly: boolean;
  fiche: Pick<FicheWithRelations, 'notesComplementaires'> &
    FicheShareProperties;
  updateNotes: (notes: string | null) => void;
};

const NotesComplementaires = ({
  isReadonly,
  fiche,
  updateNotes,
}: NotesComplementairesProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const notes = fiche.notesComplementaires;
  const isEmpty = !notes;

  return (
    <>
      {isEmpty ? (
        <EmptyCard
          picto={(props) => <NotesPicto {...props} />}
          title="Aucune note complémentaire ajoutée"
          isReadonly={isReadonly}
          actions={[
            {
              children: 'Ajouter une note',
              onClick: () => setIsModalOpen(true),
            },
          ]}
          size="xs"
        />
      ) : (
        <div className="bg-white border border-grey-3 rounded-lg py-7 lg:py-8 xl:py-10 px-5 lg:px-6 xl:px-8 flex flex-col gap-5">
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
            fiche={fiche}
            notes={notes}
            updateNotes={updateNotes}
          />
        </div>
      )}

      <ModaleCreationNote
        isOpen={isModalOpen && !isReadonly}
        fiche={fiche}
        setIsOpen={setIsModalOpen}
        updateNotes={updateNotes}
      />
    </>
  );
};

export default NotesComplementaires;
