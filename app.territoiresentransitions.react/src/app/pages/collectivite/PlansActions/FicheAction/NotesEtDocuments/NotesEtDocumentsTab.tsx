import { FicheAction } from '@/api/plan-actions';
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
        notes={fiche.notesComplementaires ?? null}
        updateNotes={(notes) =>
          updateFiche({ ...fiche, notesComplementaires: notes })
        }
      />
      <Documents
        isReadonly={isReadonly}
        collectiviteId={fiche.collectiviteId}
        ficheId={fiche.id}
      />
    </div>
  );
};

export default NotesEtDocumentsTab;
