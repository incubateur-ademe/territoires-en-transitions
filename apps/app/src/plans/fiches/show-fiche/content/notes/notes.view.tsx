import { useState } from 'react';
import { useFicheContext } from '../../context/fiche-context';
import { ContentLayout } from '../content-layout';
import { NotesTable } from './notes.table';
import { NoteDeSuiviPicto } from './notes.picto';

export const NotesView = () => {
  const { fiche, isReadonly, notes } = useFicheContext();
  const [isEditing, setIsEditing] = useState(false);
  return (
    <ContentLayout.Root>
      <ContentLayout.Empty
        isReadonly={isReadonly}
        picto={(props) => <NoteDeSuiviPicto {...props} />}
        title="Aucune note de suivi n'est renseignée"
        actions={[
          {
            children: '+ Ajouter une note de suivi',
            onClick: () => setIsEditing(true),
          },
        ]}
      />
      <ContentLayout.Content data={notes.list} byPassEmptyView={isEditing}>
        <NotesTable
          notes={notes.list || []}
          fiche={fiche}
          isReadonly={isReadonly}
          onUpsertNote={notes.upsert}
          onDeleteNote={notes.delete}
        />
      </ContentLayout.Content>
    </ContentLayout.Root>
  );
};
