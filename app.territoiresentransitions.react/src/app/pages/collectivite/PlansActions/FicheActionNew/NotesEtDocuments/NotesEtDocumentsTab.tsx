type NotesEtDocumentsTabProps = {
  notes: string | null;
};

const NotesEtDocumentsTab = ({notes}: NotesEtDocumentsTabProps) => {
  const isEmpty = !notes;

  return isEmpty ? (
    <div>Aucune note complémentaire ajoutée</div>
  ) : (
    <div>Notes et documents</div>
  );
};

export default NotesEtDocumentsTab;
