import { describe, expect, it } from 'vitest';
import { PersonneTagOrUserWithContacts } from '../collectivites/shared/models/personne-tag-or-user.dto';
import { FicheWithRelations } from '../plans/fiches/list-fiches/fiche-action-with-relations.dto';
import { getNewlyAssignedPilotes } from './get-newly-assigned-pilotes';

const createMockFiche = (
  pilotes: PersonneTagOrUserWithContacts[] | null
): FicheWithRelations => {
  return {
    id: 1,
    collectiviteId: 1,
    pilotes,
  } as FicheWithRelations;
};

const createMockPilote = (
  email: string | null | undefined,
  userId: string | null | undefined = null
): PersonneTagOrUserWithContacts => {
  return {
    nom: 'Test User',
    email,
    userId,
    tagId: null,
    collectiviteId: null,
    telephone: null,
  };
};

const userId = 'user-123';

describe('getNewlyAssignedPilotes', () => {
  describe("quand la fiche mise à jour n'a pas de pilotes avec email", () => {
    it('retourne un tableau vide', () => {
      const updatedFiche = createMockFiche([
        createMockPilote(null), // pas d'email
        createMockPilote(undefined), // pas d'email
      ]);
      const previousFiche = createMockFiche([]);

      const result = getNewlyAssignedPilotes(
        updatedFiche,
        previousFiche,
        userId
      );

      expect(result).toEqual([]);
    });

    it('retourne un tableau vide quand pilotes est null', () => {
      const updatedFiche = createMockFiche(null);
      const previousFiche = createMockFiche([]);

      const result = getNewlyAssignedPilotes(
        updatedFiche,
        previousFiche,
        userId
      );

      expect(result).toEqual([]);
    });
  });

  describe("quand la fiche précédente n'a pas de pilotes avec email", () => {
    it('retourne tous les pilotes avec email de la fiche mise à jour', () => {
      const pilote1 = createMockPilote('pilote1@example.com', 'user-1');
      const pilote2 = createMockPilote('pilote2@example.com', 'user-2');
      const updatedFiche = createMockFiche([pilote1, pilote2]);
      const previousFiche = createMockFiche([]);

      const result = getNewlyAssignedPilotes(
        updatedFiche,
        previousFiche,
        userId
      );

      expect(result).toEqual([pilote1, pilote2]);
    });

    it('retourne tous les pilotes avec email quand pilotes précédents est null', () => {
      const pilote1 = createMockPilote('pilote1@example.com', 'user-1');
      const updatedFiche = createMockFiche([pilote1]);
      const previousFiche = createMockFiche(null);

      const result = getNewlyAssignedPilotes(
        updatedFiche,
        previousFiche,
        userId
      );

      expect(result).toEqual([pilote1]);
    });
  });

  describe('quand il y a des pilotes avec email dans les deux fiches', () => {
    it('retourne uniquement les pilotes nouvellement assignés', () => {
      const pilote1 = createMockPilote('pilote1@example.com', 'user-1');
      const pilote2 = createMockPilote('pilote2@example.com', 'user-2');
      const pilote3 = createMockPilote('pilote3@example.com', 'user-3');

      const updatedFiche = createMockFiche([pilote1, pilote2, pilote3]);
      const previousFiche = createMockFiche([pilote1]); // pilote1 était déjà assigné

      const result = getNewlyAssignedPilotes(
        updatedFiche,
        previousFiche,
        userId
      );

      expect(result).toEqual([pilote2, pilote3]);
    });

    it('retourne un tableau vide si aucun nouveau pilote', () => {
      const pilote1 = createMockPilote('pilote1@example.com', 'user-1');
      const pilote2 = createMockPilote('pilote2@example.com', 'user-2');

      const updatedFiche = createMockFiche([pilote1, pilote2]);
      const previousFiche = createMockFiche([pilote1, pilote2]);

      const result = getNewlyAssignedPilotes(
        updatedFiche,
        previousFiche,
        userId
      );

      expect(result).toEqual([]);
    });
  });

  describe("exclusion de l'auto-assignation", () => {
    it("exclut les pilotes assignés par l'utilisateur lui-même", () => {
      const piloteAutoAssigne = createMockPilote('auto@example.com', userId);
      const piloteAutre = createMockPilote('autre@example.com', 'user-2');

      const updatedFiche = createMockFiche([piloteAutoAssigne, piloteAutre]);
      const previousFiche = createMockFiche([]);

      const result = getNewlyAssignedPilotes(
        updatedFiche,
        previousFiche,
        userId
      );

      expect(result).toEqual([piloteAutre]);
      expect(result).not.toContainEqual(piloteAutoAssigne);
    });

    it("exclut l'auto-assignation même si le pilote était déjà présent", () => {
      const piloteAutoAssigne = createMockPilote('auto@example.com', userId);
      const piloteAutre = createMockPilote('autre@example.com', 'user-2');

      const updatedFiche = createMockFiche([piloteAutoAssigne, piloteAutre]);
      const previousFiche = createMockFiche([piloteAutoAssigne]);

      const result = getNewlyAssignedPilotes(
        updatedFiche,
        previousFiche,
        userId
      );

      expect(result).toEqual([piloteAutre]);
    });
  });

  describe('exclusion des pilotes sans email', () => {
    it("exclut les pilotes sans email même s'ils sont nouveaux", () => {
      const piloteAvecEmail = createMockPilote('avec@example.com', 'user-1');
      const piloteSansEmail = createMockPilote(null, 'user-2');

      const updatedFiche = createMockFiche([piloteAvecEmail, piloteSansEmail]);
      const previousFiche = createMockFiche([]);

      const result = getNewlyAssignedPilotes(
        updatedFiche,
        previousFiche,
        userId
      );

      expect(result).toEqual([piloteAvecEmail]);
      expect(result).not.toContainEqual(piloteSansEmail);
    });

    it('exclut les pilotes avec email undefined', () => {
      const piloteAvecEmail = createMockPilote('avec@example.com', 'user-1');
      const piloteEmailUndefined = createMockPilote(undefined, 'user-2');

      const updatedFiche = createMockFiche([
        piloteAvecEmail,
        piloteEmailUndefined,
      ]);
      const previousFiche = createMockFiche([]);

      const result = getNewlyAssignedPilotes(
        updatedFiche,
        previousFiche,
        userId
      );

      expect(result).toEqual([piloteAvecEmail]);
    });
  });

  describe('cas complexes', () => {
    it('gère correctement un mélange de pilotes avec et sans email, auto-assignés et autres', () => {
      const piloteAutoAssigne = createMockPilote('auto@example.com', userId);
      const piloteNouveauAvecEmail = createMockPilote(
        'nouveau@example.com',
        'user-1'
      );
      const piloteSansEmail = createMockPilote(null, 'user-2');
      const piloteDejaPresent = createMockPilote('deja@example.com', 'user-3');
      const piloteNouveauAutre = createMockPilote(
        'autre@example.com',
        'user-4'
      );

      const updatedFiche = createMockFiche([
        piloteAutoAssigne,
        piloteNouveauAvecEmail,
        piloteSansEmail,
        piloteDejaPresent,
        piloteNouveauAutre,
      ]);
      const previousFiche = createMockFiche([piloteDejaPresent]);

      const result = getNewlyAssignedPilotes(
        updatedFiche,
        previousFiche,
        userId
      );

      expect(result).toEqual([piloteNouveauAvecEmail, piloteNouveauAutre]);
      expect(result).not.toContainEqual(piloteAutoAssigne);
      expect(result).not.toContainEqual(piloteSansEmail);
      expect(result).not.toContainEqual(piloteDejaPresent);
    });

    it('compare les pilotes par email pour déterminer les nouveaux', () => {
      // Même userId mais email différent = nouveau pilote
      const pilote1 = createMockPilote('email1@example.com', 'user-1');
      const pilote2 = createMockPilote('email2@example.com', 'user-1'); // même userId mais email différent

      const updatedFiche = createMockFiche([pilote1, pilote2]);
      const previousFiche = createMockFiche([pilote1]);

      const result = getNewlyAssignedPilotes(
        updatedFiche,
        previousFiche,
        userId
      );

      expect(result).toEqual([pilote2]);
    });
  });
});
