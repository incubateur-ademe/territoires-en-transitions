import { FicheNote } from '@tet/domain/plans';
import { Icon } from '@tet/ui';
import { format } from 'date-fns';

type MetadataNoteViewProps = {
  user: { nom: string; prenom: string } | null;
  date: string;
  action: 'created' | 'updated';
};

const MetadataNoteViewLabel = ({
  user: maybeUser,
  action,
  date,
}: MetadataNoteViewProps) => {
  const user = maybeUser ? `${maybeUser.prenom} ${maybeUser.nom}` : 'Inconnu';
  const label = action === 'created' ? 'Créée' : 'Modifiée';
  return (
    <div className="flex items-center gap-1">
      <Icon icon="user-line" size="sm" className="text-grey-8" />
      <span>
        {`${label} par ${user} le ${format(new Date(date), 'dd/MM/yyyy')}`}
      </span>
    </div>
  );
};

export const MetadataNoteView = ({
  note,
}: {
  note: FicheNote;
}): JSX.Element | null => {
  const shouldDisplayCreatedBy = note.createdBy && note.createdAt;
  const shouldDisplayModifiedBy =
    shouldDisplayCreatedBy &&
    note.modifiedAt &&
    note.modifiedBy &&
    note.modifiedAt !== note.createdAt;

  return (
    <>
      {shouldDisplayCreatedBy ? (
        <MetadataNoteViewLabel
          user={note.createdBy}
          action="created"
          date={note.createdAt}
        />
      ) : null}
      {shouldDisplayModifiedBy ? (
        <MetadataNoteViewLabel
          user={note.modifiedBy}
          action="updated"
          date={note.modifiedAt}
        />
      ) : null}
    </>
  );
};
