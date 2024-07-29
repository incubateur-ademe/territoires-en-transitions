import {Alert, Button, Card, Icon} from '@tet/ui';
import ModaleEditionNote from './ModaleEditionNote';
import {useState} from 'react';

type CarteNoteProps = {
  isReadonly: boolean;
  notes: string;
  updateNotes: (notes: string | null) => void;
};

const CarteNote = ({isReadonly, notes, updateNotes}: CarteNoteProps) => {
  const [openAlert, setOpenAlert] = useState(false);

  return (
    <>
      <div className="relative group">
        {/* Boutons d'édition et de suppression de la carte */}
        {!isReadonly && (
          <div className="invisible group-hover:visible absolute top-4 right-4 flex gap-2">
            <ModaleEditionNote notes={notes} updateNotes={updateNotes} />
            <Button
              icon="delete-bin-6-line"
              title="Supprimer la note"
              variant="grey"
              size="xs"
              onClick={() => setOpenAlert(true)}
            />
          </div>
        )}

        {/* Contenu de la carte */}
        <Card className="rounded-xl">
          <div className="flex gap-4">
            <div className="shrink-0 bg-primary-3 rounded-md h-9 w-9 flex items-center justify-center">
              <Icon icon="edit-box-line" className="text-primary-10" />
            </div>
            <div className="text-primary-10 text-base font-bold">{notes}</div>
          </div>
        </Card>
      </div>

      {/* Alerte de suppression de la note */}
      <Alert
        isOpen={openAlert && !isReadonly}
        onClose={() => setOpenAlert(false)}
        className="absolute bottom-0 left-0 right-0 w-screen z-modal border-t border-t-info-1"
        title="Supprimer la note"
        description="La note sera définitivement supprimée. Voulez-vous vraiment la supprimer ?"
        footer={
          <div className="flex gap-3">
            <Button
              variant="outlined"
              size="xs"
              onClick={() => setOpenAlert(false)}
            >
              Annuler
            </Button>
            <Button
              size="xs"
              onClick={() => {
                updateNotes(null);
                setOpenAlert(false);
              }}
            >
              Confirmer
            </Button>
          </div>
        }
      />
    </>
  );
};

export default CarteNote;
