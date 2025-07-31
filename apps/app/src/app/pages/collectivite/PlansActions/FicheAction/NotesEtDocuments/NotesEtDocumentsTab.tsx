import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import { useUpdateFiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-update-fiche';
import Documents from './Documents/Documents';
import NotesComplementaires from './Notes/NotesComplementaires';

type NotesEtDocumentsTabProps = {
  isReadonly: boolean;
  fiche: Fiche;
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
