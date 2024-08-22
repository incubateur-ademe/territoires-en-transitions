import {Button, Card, Icon} from '@tet/ui';
import ModaleEditionNote from './ModaleEditionNote';
import {useState} from 'react';
import AlerteSuppression from '../AlerteSuppression';
import DeleteButton from '../../DeleteButton';
import {getTruncatedText} from '../../utils';

type CarteNoteProps = {
  isReadonly: boolean;
  notes: string;
  updateNotes: (notes: string | null) => void;
};

const CarteNote = ({isReadonly, notes, updateNotes}: CarteNoteProps) => {
  const [openAlert, setOpenAlert] = useState(false);
  const [isFullNotes, setIsFullNotes] = useState(false);

  const {truncatedText: truncatedNotes, isTextTruncated: isNotesTruncated} =
    getTruncatedText(notes, 300);

  return (
    <>
      <div className="relative group">
        {/* Boutons d'édition et de suppression de la carte */}
        {!isReadonly && (
          <div className="invisible group-hover:visible absolute top-4 right-4 flex gap-2">
            <ModaleEditionNote notes={notes} updateNotes={updateNotes} />
            <DeleteButton
              title="Supprimer la note"
              size="xs"
              onClick={() => setOpenAlert(true)}
            />
          </div>
        )}

        {/* Contenu de la carte */}
        <Card className="!p-4">
          <div className="flex gap-4">
            <div className="shrink-0 bg-primary-3 rounded-md h-9 w-9 flex items-center justify-center">
              <Icon icon="edit-box-line" className="text-primary-10" />
            </div>
            <div className="text-primary-10 text-base font-bold whitespace-pre-wrap">
              {isFullNotes || !isNotesTruncated ? notes : truncatedNotes}
            </div>
          </div>
          {isNotesTruncated && (
            <Button
              variant="underlined"
              size="xs"
              className="ml-auto"
              onClick={() => setIsFullNotes(prevState => !prevState)}
            >
              {isFullNotes ? 'Voir moins' : 'Voir plus'}
            </Button>
          )}
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
