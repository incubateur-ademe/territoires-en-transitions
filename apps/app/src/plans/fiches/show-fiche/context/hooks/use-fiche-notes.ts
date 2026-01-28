import { FicheWithRelations } from '@tet/domain/plans';
import { useCallback, useMemo } from 'react';
import { useUpdateFiche } from '../../../update-fiche/data/use-update-fiche';
import { NotesState } from '../types';

export const useFicheNotes = (fiche: FicheWithRelations): NotesState => {
  const { mutateAsync: updateFiche } = useUpdateFiche();

  const upsert = useCallback(
    async (noteToUpsert: { id?: number; dateNote: number; note: string }) => {
      const formattedDateNote = `${noteToUpsert.dateNote}-01-01`;
      const formattedNoteToUpsert = {
        ...noteToUpsert,
        dateNote: formattedDateNote,
      };

      const currentNotes = fiche.notes ?? [];
      const updatedNotes =
        noteToUpsert.id === undefined
          ? [...currentNotes, formattedNoteToUpsert]
          : currentNotes.map((note) =>
              note.id === noteToUpsert.id ? formattedNoteToUpsert : note
            );

      await updateFiche({
        ficheId: fiche.id,
        ficheFields: {
          notes: updatedNotes,
        },
      });
    },
    [fiche.id, fiche.notes, updateFiche]
  );

  const deleteNote = useCallback(
    async (noteId: number) => {
      await updateFiche({
        ficheId: fiche.id,
        ficheFields: {
          notes: (fiche.notes ?? []).filter((note) => note.id !== noteId),
        },
      });
    },
    [fiche.id, fiche.notes, updateFiche]
  );

  return useMemo(
    () => ({
      list: fiche.notes ?? [],
      upsert,
      delete: deleteNote,
    }),
    [fiche.notes, upsert, deleteNote]
  );
};
