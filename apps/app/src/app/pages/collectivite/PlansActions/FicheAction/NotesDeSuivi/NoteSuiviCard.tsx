import { FicheActionNote } from '@/api/plan-actions';
import { FicheShareProperties } from '@/app/plans/fiches/share-fiche/fiche-share-properties.dto';
import { Button, Card, Icon, RichTextEditor } from '@/ui';
import { format } from 'date-fns';
import { useState } from 'react';
import { DeletedNote, EditedNote } from '../data/useUpsertNoteSuivi';
import ModaleEditionNoteDeSuivi from './ModaleEditionNoteDeSuivi';
import ModaleSuppressionNoteDeSuivi from './ModaleSuppressionNoteDeSuivi';

type NoteSuiviCardProps = {
  isReadonly?: boolean;
  fiche: FicheShareProperties;
  note: FicheActionNote;
  onEdit: (editedNote: EditedNote) => void;
  onDelete: (deletedNote: DeletedNote) => void;
};

const NoteSuiviCard = ({
  isReadonly,
  fiche,
  note,
  onEdit,
  onDelete,
}: NoteSuiviCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const year = new Date(note.dateNote).getFullYear();

  return (
    <div className="relative group">
      <div className="invisible group-hover:visible absolute top-4 right-4 flex gap-2">
        {!isReadonly && (
          <>
            <Button
              icon="edit-line"
              title="Modifier la note"
              variant="grey"
              size="xs"
              onClick={() => setIsModalOpen(true)}
            />
            {!isReadonly && isModalOpen && (
              <ModaleEditionNoteDeSuivi
                fiche={fiche}
                editedNote={note}
                onEdit={onEdit}
                isOpen={isModalOpen}
                setIsOpen={setIsModalOpen}
              />
            )}
            <ModaleSuppressionNoteDeSuivi
              fiche={fiche}
              editedNote={note}
              onDelete={onDelete}
            />
          </>
        )}
      </div>

      <Card className="h-full px-4 py-[1.125rem] !gap-3 text-grey-8 hover:border-primary-3 hover:!bg-primary-1 !shadow-none transition">
        {/* Année */}
        <span>{year}</span>

        {/* Contenu de la note */}
        <RichTextEditor
          disabled
          className="border-none !px-0 !bg-transparent"
          initialValue={note.note}
        />

        {/* Auteurs et dates */}
        <div className="flex gap-2">
          {/* Création */}
          <span className="text-grey-8 text-sm font-normal">
            <Icon icon="user-line" size="sm" className="mr-1" />
            Créée par {note.createdBy} le{' '}
            {format(new Date(note.createdAt), 'dd/MM/yyyy')}
          </span>
          {/* Edition */}
          {note.modifiedAt && note.modifiedAt !== note.createdAt && (
            <>
              <div className="w-[1px] h-4 bg-grey-5" />
              <span className="text-grey-8 text-sm font-normal">
                <Icon icon="edit-line" size="sm" className="mr-1" />
                Modifiée{note.modifiedBy ? ` par ${note.modifiedBy}` : ''}
                {note.modifiedAt
                  ? ` le ${format(new Date(note.modifiedAt), 'dd/MM/yyyy')}`
                  : ''}
              </span>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default NoteSuiviCard;
