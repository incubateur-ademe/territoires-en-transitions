import {FicheAction} from '../../FicheAction/data/types';
import EmptyCard from '../EmptyCard';
import DocumentPicto from './Documents/DocumentPicto';
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
      <EmptyCard
        picto={className => <DocumentPicto className={className} />}
        title="Aucun document ajouté"
        action={{
          label: 'Ajouter un document',
          onClick: () => {},
        }}
      />
    </div>
  );
};

export default NotesEtDocumentsTab;
