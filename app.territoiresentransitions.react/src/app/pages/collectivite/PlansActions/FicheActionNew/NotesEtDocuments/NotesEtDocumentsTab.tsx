import {FicheAction} from '../../FicheAction/data/types';
import EmptyCard from '../EmptyCard';
import DocumentPicto from './DocumentPicto';
import NotesPicto from './NotesPicto';

type NotesEtDocumentsTabProps = {
  fiche: FicheAction;
};

const NotesEtDocumentsTab = ({fiche}: NotesEtDocumentsTabProps) => {
  const {notes_complementaires: notes} = fiche;

  const isEmpty = !notes;

  return isEmpty ? (
    <div className="flex flex-col gap-6">
      <EmptyCard
        picto={className => <NotesPicto className={className} />}
        title="Aucune note complémentaire ajoutée"
        action={{
          label: 'Ajouter une note',
          onClick: () => {},
        }}
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
  ) : (
    <div>Notes et documents</div>
  );
};

export default NotesEtDocumentsTab;
