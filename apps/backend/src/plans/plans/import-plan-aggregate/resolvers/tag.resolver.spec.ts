import { ListTagsService } from '@tet/backend/collectivites/tags/list-tags/list-tags.service';
import { MutateTagService } from '@tet/backend/collectivites/tags/mutate-tag/mutate-tag.service';
import {
  AuthenticatedUser,
  AuthRole,
} from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success } from '@tet/backend/utils/result.type';
import { Tag, TagEnum, TagType } from '@tet/domain/collectivites';
import { describe, expect, it, vi } from 'vitest';
import { createTagResolver } from './tag.resolver';

const mockUser: AuthenticatedUser = {
  id: 'user-123',
  role: AuthRole.AUTHENTICATED,
  isAnonymous: false,
  jwtPayload: { role: AuthRole.AUTHENTICATED },
};

describe('createTagResolver', () => {
  const collectiviteId = 42;
  const mockTransaction = {} as Transaction;

  const createMockServices = (existingTags: Tag[] = []) => ({
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

  const resolverFor = async (
    tags: Tag[] = [],
    tagType: TagType = TagEnum.Financeur
  ) => {
    const services = createMockServices(tags);
    const { getOrCreate } = await createTagResolver(
      collectiviteId,
      services.listTagsService,
      services.mutateTagService,
      tagType,
      mockUser,
      mockTransaction
    );
    return { ...services, getOrCreate };
  };

  describe('matching un tag existant (exact normalisé)', () => {
    it('matche un tag par nom exact', async () => {
      const { getOrCreate, mutateTagService } = await resolverFor([
        { id: 1, nom: 'ADEME', collectiviteId } as Tag,
      ]);

      const result = await getOrCreate('ADEME');

      expect(result).toEqual(
        success({ id: 1, nom: 'ADEME', collectiviteId })
      );
      expect(mutateTagService.createTag).not.toHaveBeenCalled();
    });

    it('ignore la casse', async () => {
      const { getOrCreate } = await resolverFor([
        { id: 1, nom: 'ADEME', collectiviteId } as Tag,
      ]);

      const result = await getOrCreate('ademe');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
      }
    });

    it('ignore les accents', async () => {
      const { getOrCreate } = await resolverFor([
        { id: 2, nom: 'Région', collectiviteId } as Tag,
      ]);

      const result = await getOrCreate('region');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(2);
      }
    });

    it('absorbe les espaces multiples et superflus', async () => {
      const { getOrCreate } = await resolverFor([
        { id: 3, nom: 'Comité de pilotage', collectiviteId } as Tag,
      ]);

      const result = await getOrCreate('  comité   de  pilotage  ');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(3);
      }
    });

    it('ne matche pas sur un fragment (pas de fuzzy)', async () => {
      const { getOrCreate, mutateTagService } = await resolverFor([
        { id: 1, nom: 'ADEME', collectiviteId } as Tag,
      ]);

      const result = await getOrCreate('ADEM');

      expect(result.success).toBe(true);
      expect(mutateTagService.createTag).toHaveBeenCalledWith(
        { nom: 'ADEM', collectiviteId, tagType: TagEnum.Financeur },
        { tx: mockTransaction, user: mockUser, isUserTrusted: true }
      );
    });
  });

  describe('création de tag', () => {
    it('crée un nouveau tag quand aucun ne correspond', async () => {
      const { getOrCreate, mutateTagService } = await resolverFor([
        { id: 1, nom: 'ADEME', collectiviteId } as Tag,
      ]);

      const result = await getOrCreate('Nouvelle Entité');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatchObject({
          nom: 'Nouvelle Entité',
          collectiviteId,
        });
      }
      expect(mutateTagService.createTag).toHaveBeenCalledWith(
        {
          nom: 'Nouvelle Entité',
          collectiviteId,
          tagType: TagEnum.Financeur,
        },
        { tx: mockTransaction, user: mockUser, isUserTrusted: true }
      );
    });

    it('ne recrée pas un tag déjà créé pendant la même session (variations de casse)', async () => {
      const services = createMockServices([]);
      (
        services.mutateTagService.createTag as ReturnType<typeof vi.fn>
      ).mockResolvedValue(
        success({ id: 999, nom: 'Nouvelle', collectiviteId })
      );

      const { getOrCreate } = await createTagResolver(
        collectiviteId,
        services.listTagsService,
        services.mutateTagService,
        TagEnum.Financeur,
        mockUser,
        mockTransaction
      );

      const first = await getOrCreate('Nouvelle');
      const second = await getOrCreate('  NOUVELLE  ');

      expect(first.success).toBe(true);
      expect(second.success).toBe(true);
      if (first.success && second.success) {
        expect(first.data.id).toBe(999);
        expect(second.data.id).toBe(999);
      }
      expect(services.mutateTagService.createTag).toHaveBeenCalledTimes(1);
    });

    it('remonte l\'erreur si la création échoue', async () => {
      const services = createMockServices([]);
      (
        services.mutateTagService.createTag as ReturnType<typeof vi.fn>
      ).mockResolvedValue(failure('Database error'));

      const { getOrCreate } = await createTagResolver(
        collectiviteId,
        services.listTagsService,
        services.mutateTagService,
        TagEnum.Financeur,
        mockUser,
        mockTransaction
      );

      const result = await getOrCreate('Nouveau');

      expect(result).toEqual(failure('Database error'));
    });
  });

  describe('comportement transverse', () => {
    it('ne refait pas appel à listTags entre deux résolutions', async () => {
      const { getOrCreate, listTagsService } = await resolverFor([
        { id: 1, nom: 'ADEME', collectiviteId } as Tag,
      ]);

      await getOrCreate('ADEME');
      await getOrCreate('ADEME');

      expect(listTagsService.listTags).toHaveBeenCalledTimes(1);
    });

    it('supporte plusieurs tag types', async () => {
      const tagTypes = [
        TagEnum.Financeur,
        TagEnum.Structure,
        TagEnum.Service,
        TagEnum.Partenaire,
      ] as const;

      await Promise.all(
        tagTypes.map(async (tagType) => {
          const { getOrCreate, mutateTagService } = await resolverFor(
            [],
            tagType
          );

          await getOrCreate('Test Entity');

          expect(mutateTagService.createTag).toHaveBeenCalledWith(
            { nom: 'Test Entity', collectiviteId, tagType },
            { tx: mockTransaction, user: mockUser, isUserTrusted: true }
          );
        })
      );
    });
  });
});
