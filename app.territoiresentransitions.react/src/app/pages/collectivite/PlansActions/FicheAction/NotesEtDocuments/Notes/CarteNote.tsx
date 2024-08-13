import {Alert, Button, Card, Icon} from '@tet/ui';
import ModaleEditionNote from './ModaleEditionNote';
import {useState} from 'react';
import AlerteSuppression from '../AlerteSuppression';

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
        <Card className="rounded-xl !p-4">
          <div className="flex gap-4">
            <div className="shrink-0 bg-primary-3 rounded-md h-9 w-9 flex items-center justify-center">
              <Icon icon="edit-box-line" className="text-primary-10" />
            </div>
            <div className="text-primary-10 text-base font-bold whitespace-pre-wrap">
              {notes}
            </div>
          </div>
        </Card>
      </div>

      {/* Alerte de suppression de la note */}
      <AlerteSuppression
        isOpen={openAlert && !isReadonly}
        setIsOpen={setOpenAlert}
        title="Supprimer la note"
        message="La note sera définitivement supprimée. Voulez-vous vraiment la supprimer ?"
        onDelete={() => updateNotes(null)}
      />
    </>
  );
};

export default CarteNote;
