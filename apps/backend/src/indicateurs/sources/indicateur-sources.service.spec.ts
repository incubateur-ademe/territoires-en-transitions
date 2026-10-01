import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ResourceType } from '@tet/domain/users';
import { IndicateurSourcesRepository } from './indicateur-sources.repository';
import IndicateurSourcesService from './indicateur-sources.service';

describe('IndicateurSourcesService', () => {
  const input = { collectiviteId: 42, indicateurId: 7 };
  const user = { id: 'user-id' } as AuthenticatedUser;

  it('authorizes the collectivity before loading available sources', async () => {
    const sources = [{ id: 'territoire', libelle: 'Territoire' }];
    const repository = {
      listAvailableSources: vi.fn().mockResolvedValue(sources),
    } as unknown as IndicateurSourcesRepository;
    const permissionService = {
      assertAllowed: vi.fn().mockResolvedValue(undefined),
    } as unknown as PermissionService;
    const service = new IndicateurSourcesService(repository, permissionService);

    await expect(service.getAvailableSources(input, { user })).resolves.toBe(
      sources
    );
    expect(permissionService.assertAllowed).toHaveBeenCalledWith(
      user,
      'indicateurs.valeurs.read',
      ResourceType.COLLECTIVITE,
      { collectiviteId: input.collectiviteId }
    );
    expect(repository.listAvailableSources).toHaveBeenCalledWith(input);
  });

  it('does not query persistence when authorization is denied', async () => {
    const repository = {
      listAvailableSources: vi.fn(),
    } as unknown as IndicateurSourcesRepository;
    const denial = new Error('Droits insuffisants');
    const permissionService = {
      assertAllowed: vi.fn().mockRejectedValue(denial),
    } as unknown as PermissionService;
    const service = new IndicateurSourcesService(repository, permissionService);

    await expect(service.getAvailableSources(input, { user })).rejects.toBe(
      denial
    );
    expect(repository.listAvailableSources).not.toHaveBeenCalled();
  });

  it('forwards a computation transaction when listing metadata', async () => {
    const tx = {} as Transaction;
    const repository = {
      listMetadonnees: vi.fn().mockResolvedValue([]),
    } as unknown as IndicateurSourcesRepository;
    const service = new IndicateurSourcesService(
      repository,
      {} as PermissionService
    );

    await service.getAllIndicateurSourceMetadonnees(tx);

    expect(repository.listMetadonnees).toHaveBeenCalledWith(tx);
  });

  it('délègue les commandes et lectures de catalogue au repository', async () => {
    const createdMetadonnee = { id: 1 };
    const foundMetadonnee = { id: 2 };
    const sources = [{ id: 'insee', libelle: 'INSEE' }];
    const repository = {
      createMetadonnee: vi.fn().mockResolvedValue(createdMetadonnee),
      getMetadonnee: vi.fn().mockResolvedValue(foundMetadonnee),
      upsertSource: vi.fn().mockResolvedValue(undefined),
      listSources: vi.fn().mockResolvedValue(sources),
    } as unknown as IndicateurSourcesRepository;
    const service = new IndicateurSourcesService(
      repository,
      {} as PermissionService
    );
    const metadonnee = { sourceId: 'insee', dateVersion: '2026' } as never;
    const source = { id: 'insee', libelle: 'INSEE' } as never;

    await expect(
      service.createIndicateurSourceMetadonnee(metadonnee)
    ).resolves.toBe(createdMetadonnee);
    await expect(
      service.getIndicateurSourceMetadonnee('insee', '2026')
    ).resolves.toBe(foundMetadonnee);
    await expect(
      service.upsertIndicateurSource(source)
    ).resolves.toBeUndefined();
    await expect(service.getAllSources()).resolves.toBe(sources);

    expect(repository.createMetadonnee).toHaveBeenCalledWith(metadonnee);
    expect(repository.getMetadonnee).toHaveBeenCalledWith('insee', '2026');
    expect(repository.upsertSource).toHaveBeenCalledWith(source);
    expect(repository.listSources).toHaveBeenCalledOnce();
  });
});
