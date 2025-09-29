import ModaleSuppressionNote from '@/app/app/pages/collectivite/PlansActions/FicheAction/NotesEtDocuments/Notes/ModaleSuppressionNote';
import { FicheShareProperties } from '@/app/plans/fiches/share-fiche/fiche-share-properties.dto';
import { Card, Icon } from '@/ui';
import { RichTextView } from '../../../components/RichTextView';
import ModaleEditionNote from './ModaleEditionNote';

type CarteNoteProps = {
  isReadonly: boolean;
  fiche: FicheShareProperties;
  notes: string;
  updateNotes: (notes: string | null) => void;
};

const CarteNote = ({
  isReadonly,
  fiche,
  notes,
  updateNotes,
}: CarteNoteProps) => {
  return (
    <>
      <div className="relative group">
        {/* Boutons d'édition et de suppression de la carte */}
        {!isReadonly && (
          <div className="invisible group-hover:visible absolute top-4 right-4 flex gap-2 z-[1]">
            <ModaleEditionNote
              fiche={fiche}
              notes={notes}
              updateNotes={updateNotes}
            />
            <ModaleSuppressionNote
              fiche={fiche}
              onDelete={() => updateNotes(null)}
            />
          </div>
        )}

        {/* Contenu de la carte */}
        <Card className="!p-4">
          <div className="flex gap-4">
            <div className="shrink-0 bg-primary-3 rounded-md h-9 w-9 flex items-center justify-center">
              <Icon icon="edit-box-line" className="text-primary-10" />
            </div>
            <RichTextView content={notes} textColor="grey" maxHeight="sm" />
          </div>
        </Card>
      </div>
    </>
  );
};

export default CarteNote;
