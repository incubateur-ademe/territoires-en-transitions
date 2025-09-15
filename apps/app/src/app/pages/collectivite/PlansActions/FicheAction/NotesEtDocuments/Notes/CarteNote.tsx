import ModaleSuppressionNote from '@/app/app/pages/collectivite/PlansActions/FicheAction/NotesEtDocuments/Notes/ModaleSuppressionNote';
import { FicheShareProperties } from '@/app/plans/fiches/share-fiche/fiche-share-properties.dto';
import { htmlToText } from '@/domain/utils';
import { Button, Card, Icon, RichTextEditor } from '@/ui';
import { cn } from '@/ui/utils/cn';
import { useState } from 'react';
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
  const [isFullNotes, setIsFullNotes] = useState(false);

  const isNotesTruncated = htmlToText(notes).length > 200;

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
            <RichTextEditor
              disabled
              className={cn('border-none !p-0', {
                'max-h-[6rem] overflow-hidden': !isFullNotes,
              })}
              initialValue={notes}
            />
          </div>
          {isNotesTruncated && (
            <Button
              variant="underlined"
              size="xs"
              className="ml-auto"
              onClick={() => setIsFullNotes((prevState) => !prevState)}
            >
              {isFullNotes ? 'Voir moins' : 'Voir plus'}
            </Button>
          )}
        </Card>
      </div>
    </>
  );
};

export default CarteNote;
