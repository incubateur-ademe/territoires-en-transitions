import { useFicheContext } from '../../context/fiche-context';
import { ContentLayout } from '../content-layout';
import { NotesTable } from './notes.table';

export const NotesView = () => {
  const { fiche, isReadonly, notes } = useFicheContext();
  const onCreateNote = async () =>
    await notes.upsert({
      note: '',
      dateNote: new Date().getFullYear(),
    });
  return (
    <ContentLayout.Root>
      <ContentLayout.Content data={[]}>
        <NotesTable
          notes={notes.list || []}
          fiche={fiche}
          isReadonly={isReadonly}
          onUpsertNote={notes.upsert}
          onDeleteNote={notes.delete}
          onCreateNote={onCreateNote}
        />
      </ContentLayout.Content>
    </ContentLayout.Root>
  );
};
