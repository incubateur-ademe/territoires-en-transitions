import {FicheAction} from '../../FicheAction/data/types';
import Documents from './Documents/Documents';
import NotesComplementaires from './Notes/NotesComplementaires';

type NotesEtDocumentsTabProps = {
  isReadonly: boolean;
  fiche: FicheAction;
  updateFiche: (fiche: FicheAction) => void;
};

const NotesEtDocumentsTab = ({
  isReadonly,
  fiche,
  updateFiche,
}: NotesEtDocumentsTabProps) => {
  return (
    <div className="flex flex-col gap-6">
      <NotesComplementaires
        isReadonly={isReadonly}
        notes={fiche.notes_complementaires}
        updateNotes={notes =>
          updateFiche({...fiche, notes_complementaires: notes})
        }
      />
      <Documents isReadonly={isReadonly} ficheId={fiche.id} />
    </div>
  );
};

export default NotesEtDocumentsTab;
