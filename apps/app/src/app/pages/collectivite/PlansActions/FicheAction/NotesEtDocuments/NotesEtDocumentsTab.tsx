import { useUpdateFiche } from '@/app/plans/fiches/update-fiche/data/use-update-fiche';
import { FicheWithRelations } from '@/domain/plans';
import Documents from './Documents/Documents';
import NotesComplementaires from './Notes/NotesComplementaires';

type NotesEtDocumentsTabProps = {
  isReadonly: boolean;
  fiche: FicheWithRelations;
};

const NotesEtDocumentsTab = ({
  isReadonly,
  fiche,
}: NotesEtDocumentsTabProps) => {
  const { mutate: updateFiche } = useUpdateFiche();

  return (
    <div className="flex flex-col gap-6">
      <NotesComplementaires
        isReadonly={isReadonly}
        fiche={fiche}
        updateNotes={(notes) =>
          updateFiche({
            ficheId: fiche.id,
            ficheFields: { notesComplementaires: notes },
          })
        }
      />
      <Documents
        isReadonly={isReadonly}
        collectiviteId={fiche.collectiviteId}
        fiche={fiche}
      />
    </div>
  );
};

export default NotesEtDocumentsTab;
