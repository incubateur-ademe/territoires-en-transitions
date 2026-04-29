import { ListMembresService } from '@tet/backend/collectivites/membres/list-membres/list-membres.service';
import { ListTagsService } from '@tet/backend/collectivites/tags/list-tags/list-tags.service';
import { MutateTagService } from '@tet/backend/collectivites/tags/mutate-tag/mutate-tag.service';
import {
  AuthenticatedUser,
  AuthRole,
} from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success } from '@tet/backend/utils/result.type';
import { Membre, Tag, TagEnum } from '@tet/domain/collectivites';
import { describe, expect, it, vi } from 'vitest';
import { createPersonneResolver } from './personne.resolver';

const mockUser: AuthenticatedUser = {
  id: 'user-123',
  role: AuthRole.AUTHENTICATED,
  isAnonymous: false,
  jwtPayload: { role: AuthRole.AUTHENTICATED },
};

const buildMembre = (overrides: Partial<Membre> & Pick<Membre, 'userId' | 'prenom' | 'nom'>): Membre => ({
  email: `${overrides.userId}@test.local`,
  telephone: null,
  role: 'admin',
  fonction: null,
  detailsFonction: null,
  champIntervention: null,
  estReferent: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('createPersonneResolver', () => {
  const collectiviteId = 42;
  const mockTransaction = {} as Transaction;

  const createMockServices = (
    existingMembres: Membre[] = [],
    existingTags: Tag[] = []
  ) => ({
    listMembresService: {
      list: vi.fn().mockResolvedValue({ membres: existingMembres }),
    } as unknown as ListMembresService,
    listTagsService: {
      listTags: vi.fn().mockResolvedValue(success(existingTags)),
    } as unknown as ListTagsService,
    mutateTagService: {
      createTag: vi.fn().mockImplementation((tagData) =>
        Promise.resolve(
          success({
            id: Math.floor(Math.random() * 1000),
            nom: tagData.nom,
            collectiviteId: tagData.collectiviteId,
          })
        )
      ),
    } as unknown as MutateTagService,
  });

  const resolverFor = async (membres: Membre[] = [], tags: Tag[] = []) => {
    const services = createMockServices(membres, tags);
    const { getOrCreatePersonne } = await createPersonneResolver(
      collectiviteId,
      services.listMembresService,
      services.listTagsService,
      services.mutateTagService,
      mockUser,
      mockTransaction
    );
    return { ...services, getOrCreatePersonne };
  };

  describe('matching un membre existant', () => {
    it('matche un membre par "prénom nom"', async () => {
      const { getOrCreatePersonne, mutateTagService } = await resolverFor([
        buildMembre({ userId: 'user-1', prenom: 'Léopold', nom: 'Chabas' }),
      ]);

      const result = await getOrCreatePersonne('Léopold Chabas');

      expect(result).toEqual(success({ userId: 'user-1' }));
      expect(mutateTagService.createTag).not.toHaveBeenCalled();
    });

    it('matche un membre par "nom prénom"', async () => {
      const { getOrCreatePersonne } = await resolverFor([
        buildMembre({ userId: 'user-1', prenom: 'Léopold', nom: 'Chabas' }),
      ]);

      const result = await getOrCreatePersonne('Chabas Léopold');

      expect(result).toEqual(success({ userId: 'user-1' }));
    });

    it('ignore la casse', async () => {
      const { getOrCreatePersonne } = await resolverFor([
        buildMembre({ userId: 'user-1', prenom: 'Léopold', nom: 'Chabas' }),
      ]);

      const result = await getOrCreatePersonne('LÉOPOLD chabas');

      expect(result).toEqual(success({ userId: 'user-1' }));
    });

    it('ignore les accents', async () => {
      const { getOrCreatePersonne } = await resolverFor([
        buildMembre({ userId: 'user-1', prenom: 'Léopold', nom: 'Chabas' }),
      ]);

      const result = await getOrCreatePersonne('Leopold Chabas');

      expect(result).toEqual(success({ userId: 'user-1' }));
    });

    it('absorbe les espaces multiples et superflus', async () => {
      const { getOrCreatePersonne } = await resolverFor([
        buildMembre({ userId: 'user-1', prenom: 'Léopold', nom: 'Chabas' }),
      ]);

      const result = await getOrCreatePersonne('  Léopold   Chabas  ');

      expect(result).toEqual(success({ userId: 'user-1' }));
    });

    it("ne matche pas sur un fragment (pas de fuzzy)", async () => {
      const { getOrCreatePersonne, mutateTagService } = await resolverFor([
        buildMembre({ userId: 'user-1', prenom: 'Léopold', nom: 'Chabas' }),
      ]);

      const result = await getOrCreatePersonne('Chabas');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBeUndefined();
        expect(result.data.tagId).toBeDefined();
      }
      expect(mutateTagService.createTag).toHaveBeenCalledWith(
        { tagType: TagEnum.Personne, nom: 'Chabas', collectiviteId },
        { user: mockUser, isUserTrusted: true, tx: mockTransaction }
      );
    });
  });

  describe('ambiguïté entre plusieurs membres', () => {
    it('renvoie une erreur si deux membres ont exactement le même nom', async () => {
      const { getOrCreatePersonne, mutateTagService } = await resolverFor([
        buildMembre({
          userId: 'user-1',
          prenom: 'Jean',
          nom: 'Martin',
          email: 'jean.martin@a.fr',
        }),
        buildMembre({
          userId: 'user-2',
          prenom: 'Jean',
          nom: 'Martin',
          email: 'jean.martin@b.fr',
        }),
      ]);

      const result = await getOrCreatePersonne('Jean Martin');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Plusieurs membres correspondent');
        expect(result.error).toContain('jean.martin@a.fr');
        expect(result.error).toContain('jean.martin@b.fr');
      }
      expect(mutateTagService.createTag).not.toHaveBeenCalled();
    });

    it('signale l\'ambiguïté quand un prénom/nom inversé matche un autre membre', async () => {
      const { getOrCreatePersonne } = await resolverFor([
        buildMembre({
          userId: 'user-1',
          prenom: 'Jean',
          nom: 'Martin',
          email: 'a@test.fr',
        }),
        buildMembre({
          userId: 'user-2',
          prenom: 'Martin',
          nom: 'Jean',
          email: 'b@test.fr',
        }),
      ]);

      const result = await getOrCreatePersonne('Jean Martin');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Plusieurs membres correspondent');
      }
    });
  });

  describe('matching un tag existant', () => {
    it('renvoie le tagId si un tag normalisé identique existe', async () => {
      const tag: Tag = { id: 7, nom: 'Comité de pilotage', collectiviteId } as Tag;
      const { getOrCreatePersonne, mutateTagService } = await resolverFor([], [
        tag,
      ]);

      const result = await getOrCreatePersonne('comité  de  pilotage');

      expect(result).toEqual(success({ tagId: 7 }));
      expect(mutateTagService.createTag).not.toHaveBeenCalled();
    });

    it('préfère un membre à un tag de même nom', async () => {
      const { getOrCreatePersonne } = await resolverFor(
        [buildMembre({ userId: 'user-1', prenom: 'Léopold', nom: 'Chabas' })],
        [{ id: 99, nom: 'Léopold Chabas', collectiviteId } as Tag]
      );

      const result = await getOrCreatePersonne('Léopold Chabas');

      expect(result).toEqual(success({ userId: 'user-1' }));
    });
  });

  describe('création de tag', () => {
    it('crée un tag quand ni membre ni tag ne correspond', async () => {
      const { getOrCreatePersonne, mutateTagService } = await resolverFor();
      (mutateTagService.createTag as ReturnType<typeof vi.fn>).mockResolvedValue(
        success({ id: 999, nom: 'Service Voirie', collectiviteId })
      );

      const result = await getOrCreatePersonne('Service Voirie');

      expect(result).toEqual(success({ tagId: 999 }));
      expect(mutateTagService.createTag).toHaveBeenCalledWith(
        { tagType: TagEnum.Personne, nom: 'Service Voirie', collectiviteId },
        { user: mockUser, isUserTrusted: true, tx: mockTransaction }
      );
    });

    it('ne recrée pas un tag déjà créé pendant la même session (variations de casse)', async () => {
      const { getOrCreatePersonne, mutateTagService } = await resolverFor();
      (mutateTagService.createTag as ReturnType<typeof vi.fn>).mockResolvedValue(
        success({ id: 123, nom: 'Service Voirie', collectiviteId })
      );

      const first = await getOrCreatePersonne('Service Voirie');
      const second = await getOrCreatePersonne('  service  voirie  ');

      expect(first).toEqual(success({ tagId: 123 }));
      expect(second).toEqual(success({ tagId: 123 }));
      expect(mutateTagService.createTag).toHaveBeenCalledTimes(1);
    });

    it('remonte l\'erreur si la création échoue', async () => {
      const { getOrCreatePersonne, mutateTagService } = await resolverFor();
      (mutateTagService.createTag as ReturnType<typeof vi.fn>).mockResolvedValue(
        failure('Database error')
      );

      const result = await getOrCreatePersonne('Nouveau');

      expect(result).toEqual(failure('Database error'));
    });
  });
});
