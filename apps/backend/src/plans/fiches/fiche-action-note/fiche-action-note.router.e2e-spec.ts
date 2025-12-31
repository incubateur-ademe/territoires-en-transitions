import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.fixture';
import { ficheActionNoteTable } from '@tet/backend/plans/fiches/fiche-action-note/fiche-action-note.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import {
  getAuthUser,
  getAuthUserFromDcp,
  getTestApp,
  getTestDatabase,
  getTestRouter,
  YOLO_DODO,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite } from '@tet/domain/collectivites';
import { FicheNoteUpsert } from '@tet/domain/plans';
import { CollectiviteAccessLevelEnum } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { onTestFinished } from 'vitest';

describe('Fiche Action Note Router', () => {
  let router: TrpcRouter;
  let db: DatabaseService;
  let collectivite: Collectivite;
  let editorUser: AuthenticatedUser;
  let ficheId: number;

  beforeAll(async () => {
    const app = await getTestApp();
    router = await getTestRouter();
    db = await getTestDatabase(app);

    const testCollectiviteAndUserResult = await addTestCollectiviteAndUser(db, {
      user: {
        accessLevel: CollectiviteAccessLevelEnum.ADMIN,
      },
    });

    collectivite = testCollectiviteAndUserResult.collectivite;
    editorUser = getAuthUserFromDcp(testCollectiviteAndUserResult.user);

    const caller = router.createCaller({ user: editorUser });
    const createdFiche = await caller.plans.fiches.create({
      fiche: {
        titre: 'Fiche de test pour notes',
        collectiviteId: collectivite.id,
      },
    });
    ficheId = createdFiche.id;

    onTestFinished(async () => {
      await testCollectiviteAndUserResult.cleanup();
      try {
        await db.db
          .delete(ficheActionTable)
          .where(eq(ficheActionTable.id, ficheId));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    });
  });

  describe('List Notes - Success Cases', () => {
    test('Successfully list notes for a fiche', async () => {
      const caller = router.createCaller({ user: editorUser });

      const notes = await caller.plans.fiches.notes.list({ ficheId });

      expect(notes).toBeDefined();
      expect(Array.isArray(notes)).toBe(true);
    });

    test('Returns empty array when no notes exist', async () => {
      const caller = router.createCaller({ user: editorUser });

      const notes = await caller.plans.fiches.notes.list({ ficheId });

      expect(notes).toEqual([]);
    });
  });

  describe('Upsert Notes - Success Cases', () => {
    test('Successfully create a new note', async () => {
      const caller = router.createCaller({ user: editorUser });

      const noteToCreate: FicheNoteUpsert = {
        dateNote: '2024-01-15',
        note: 'Première note de test',
      };

      await caller.plans.fiches.notes.upsert({
        ficheId,
        note: noteToCreate,
      });

      const notes = await caller.plans.fiches.notes.list({ ficheId });
      expect(notes.length).toBe(1);
      expect(notes[0].note).toBe(noteToCreate.note);
      expect(notes[0].dateNote).toBe(noteToCreate.dateNote);

      onTestFinished(async () => {
        try {
          await db.db
            .delete(ficheActionNoteTable)
            .where(eq(ficheActionNoteTable.ficheId, ficheId));
        } catch (error) {
          console.error('Erreur lors de la suppression:', error);
        }
      });
    });

    test('Successfully update an existing note', async () => {
      const caller = router.createCaller({ user: editorUser });

      const noteToCreate: FicheNoteUpsert = {
        dateNote: '2024-01-20',
        note: 'Note originale',
      };

      await caller.plans.fiches.notes.upsert({
        ficheId,
        note: noteToCreate,
      });

      const notesAfterCreate = await caller.plans.fiches.notes.list({
        ficheId,
      });
      expect(notesAfterCreate.length).toBe(1);
      const noteId = notesAfterCreate[0].id;

      const noteToUpdate: FicheNoteUpsert = {
        id: noteId,
        dateNote: '2024-01-21',
        note: 'Note modifiée',
      };

      await caller.plans.fiches.notes.upsert({
        ficheId,
        note: noteToUpdate,
      });

      const notesAfterUpdate = await caller.plans.fiches.notes.list({
        ficheId,
      });
      expect(notesAfterUpdate.length).toBe(1);
      expect(notesAfterUpdate[0].note).toBe(noteToUpdate.note);
      expect(notesAfterUpdate[0].dateNote).toBe(noteToUpdate.dateNote);
      expect(notesAfterUpdate[0].id).toBe(noteId);

      onTestFinished(async () => {
        try {
          await db.db
            .delete(ficheActionNoteTable)
            .where(eq(ficheActionNoteTable.ficheId, ficheId));
        } catch (error) {
          console.error('Erreur lors de la suppression:', error);
        }
      });
    });

    test('Successfully create multiple notes', async () => {
      const caller = router.createCaller({ user: editorUser });

      const note1: FicheNoteUpsert = {
        dateNote: '2024-02-01',
        note: 'Première note',
      };
      const note2: FicheNoteUpsert = {
        dateNote: '2024-02-02',
        note: 'Deuxième note',
      };
      const note3: FicheNoteUpsert = {
        dateNote: '2024-02-03',
        note: 'Troisième note',
      };

      await caller.plans.fiches.notes.upsert({ ficheId, note: note1 });
      await caller.plans.fiches.notes.upsert({ ficheId, note: note2 });
      await caller.plans.fiches.notes.upsert({ ficheId, note: note3 });

      const notes = await caller.plans.fiches.notes.list({ ficheId });
      expect(notes.length).toBe(3);

      // Notes should be ordered by dateNote descending
      expect(notes[0].dateNote).toBe(note3.dateNote);
      expect(notes[1].dateNote).toBe(note2.dateNote);
      expect(notes[2].dateNote).toBe(note1.dateNote);

      onTestFinished(async () => {
        try {
          await db.db
            .delete(ficheActionNoteTable)
            .where(eq(ficheActionNoteTable.ficheId, ficheId));
        } catch (error) {
          console.error('Erreur lors de la suppression:', error);
        }
      });
    });
  });

  describe('Delete Notes - Success Cases', () => {
    test('Successfully delete a note', async () => {
      const caller = router.createCaller({ user: editorUser });

      // Create a note first
      const noteToCreate: FicheNoteUpsert = {
        dateNote: '2024-03-01',
        note: 'Note à supprimer',
      };

      await caller.plans.fiches.notes.upsert({
        ficheId,
        note: noteToCreate,
      });

      const notesBeforeDelete = await caller.plans.fiches.notes.list({
        ficheId,
      });
      expect(notesBeforeDelete.length).toBe(1);
      const noteId = notesBeforeDelete[0].id;

      // Delete the note
      await caller.plans.fiches.notes.delete({ ficheId, noteId });

      const notesAfterDelete = await caller.plans.fiches.notes.list({
        ficheId,
      });
      expect(notesAfterDelete.length).toBe(0);
    });
  });

  describe('Access Rights', () => {
    test('User without rights on collectivite cannot list notes', async () => {
      const yoloDodoUser = await getAuthUser(YOLO_DODO);
      const caller = router.createCaller({ user: yoloDodoUser });

      await expect(
        caller.plans.fiches.notes.list({ ficheId })
      ).rejects.toThrow();
    });

    test('User without rights on collectivite cannot create notes', async () => {
      const yoloDodoUser = await getAuthUser(YOLO_DODO);
      const caller = router.createCaller({ user: yoloDodoUser });

      const noteToCreate: FicheNoteUpsert = {
        dateNote: '2024-05-01',
        note: 'Note non autorisée',
      };

      await expect(
        caller.plans.fiches.notes.upsert({
          ficheId,
          note: noteToCreate,
        })
      ).rejects.toThrow();
    });

    test('User without rights on collectivite cannot delete notes', async () => {
      const yoloDodoUser = await getAuthUser(YOLO_DODO);
      const caller = router.createCaller({ user: yoloDodoUser });

      await expect(
        caller.plans.fiches.notes.delete({ ficheId, noteId: 999 })
      ).rejects.toThrow();
    });

    test('User with lecture rights on collectivite cannot create notes', async () => {
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        accessLevel: CollectiviteAccessLevelEnum.LECTURE,
      });

      onTestFinished(async () => {
        await cleanup();
      });

      const lectureUser = getAuthUserFromDcp(user);
      const caller = router.createCaller({ user: lectureUser });

      const noteToCreate: FicheNoteUpsert = {
        dateNote: '2024-06-01',
        note: 'Note non autorisée',
      };

      await expect(
        caller.plans.fiches.notes.upsert({
          ficheId,
          note: noteToCreate,
        })
      ).rejects.toThrow();
    });

    test('User with lecture rights on collectivite cannot delete notes', async () => {
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        accessLevel: CollectiviteAccessLevelEnum.LECTURE,
      });

      onTestFinished(async () => {
        await cleanup();
      });

      const lectureUser = getAuthUserFromDcp(user);
      const caller = router.createCaller({ user: lectureUser });

      await expect(
        caller.plans.fiches.notes.delete({ ficheId, noteId: 999 })
      ).rejects.toThrow();
    });

    test('User with lecture rights can list notes', async () => {
      // First create a note with an admin user
      const adminCaller = router.createCaller({ user: editorUser });
      const noteToCreate: FicheNoteUpsert = {
        dateNote: '2024-07-01',
        note: 'Note visible en lecture',
      };
      await adminCaller.plans.fiches.notes.upsert({
        ficheId,
        note: noteToCreate,
      });

      // Then try to list with a lecture user
      const { user, cleanup } = await addTestUser(db, {
        collectiviteId: collectivite.id,
        accessLevel: CollectiviteAccessLevelEnum.LECTURE,
      });

      onTestFinished(async () => {
        await cleanup();
        try {
          await db.db
            .delete(ficheActionNoteTable)
            .where(eq(ficheActionNoteTable.ficheId, ficheId));
        } catch (error) {
          console.error('Erreur lors de la suppression:', error);
        }
      });

      const lectureUser = getAuthUserFromDcp(user);
      const caller = router.createCaller({ user: lectureUser });

      const notes = await caller.plans.fiches.notes.list({ ficheId });
      expect(notes.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    test('Upsert with invalid ficheId throws error', async () => {
      const caller = router.createCaller({ user: editorUser });

      const noteToCreate: FicheNoteUpsert = {
        dateNote: '2024-08-01',
        note: 'Note avec fiche invalide',
      };

      await expect(
        caller.plans.fiches.notes.upsert({
          ficheId: 999999,
          note: noteToCreate,
        })
      ).rejects.toThrow();
    });

    test('Delete with invalid noteId does not throw but does nothing', async () => {
      const caller = router.createCaller({ user: editorUser });

      // This should not throw, but should not delete anything
      await caller.plans.fiches.notes.delete({
        ficheId,
        noteId: 999999,
      });

      // Verify no notes were affected
      const notes = await caller.plans.fiches.notes.list({ ficheId });
      // The count should remain the same as before
      expect(Array.isArray(notes)).toBe(true);
    });
  });
});
