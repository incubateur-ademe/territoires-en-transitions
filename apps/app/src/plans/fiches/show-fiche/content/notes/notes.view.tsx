import { useFicheContext } from '../../context/fiche-context';
import { ContentLayout } from '../content-layout';
import { NotesTable } from './notes.table';

export const NotesView = () => {
  const { fiche, isReadonly, notes } = useFicheContext();
  return (
    <ContentLayout.Root>
      <ContentLayout.Content data={notes.list}>
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
