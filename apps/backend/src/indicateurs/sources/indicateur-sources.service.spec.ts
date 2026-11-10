import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success } from '@tet/backend/utils/result.type';
import { ResourceType } from '@tet/domain/users';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import { TrajectoireSnbc3FeatureFlagService } from '../trajectoires/trajectoire-snbc3-feature-flag.service';
import { IndicateurSourcesRepository } from './indicateur-sources.repository';
import IndicateurSourcesService from './indicateur-sources.service';

describe('IndicateurSourcesService', () => {
  const input = { collectiviteId: 42, indicateurId: 7 };
  const user = { id: 'user-id' } as AuthenticatedUser;
  const featureFlag = (enabled = true) =>
    new TrajectoireSnbc3FeatureFlagService({
      isFeatureEnabled: vi.fn().mockResolvedValue(enabled),
    } as unknown as TrackingService);

  it('authorizes the collectivity before loading available sources', async () => {
    const sources = [{ id: 'territoire', libelle: 'Territoire' }];
    const repository = {
      listAvailableSources: vi.fn().mockResolvedValue(sources),
    } as unknown as IndicateurSourcesRepository;
    const permissionService = {
      isAllowed: vi.fn().mockResolvedValue(success(undefined)),
    } as unknown as PermissionService;
    const service = new IndicateurSourcesService(
      repository,
      permissionService,
      featureFlag()
    );

    await expect(service.getAvailableSources(input, { user })).resolves.toEqual(
      success(sources)
    );
    expect(permissionService.isAllowed).toHaveBeenCalledWith(
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
    const permissionService = {
      isAllowed: vi.fn().mockResolvedValue(failure('UNAUTHORIZED')),
    } as unknown as PermissionService;
    const service = new IndicateurSourcesService(
      repository,
      permissionService,
      featureFlag()
    );

    await expect(service.getAvailableSources(input, { user })).resolves.toEqual(
      failure('UNAUTHORIZED')
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
      {} as PermissionService,
      featureFlag()
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
      {} as PermissionService,
      featureFlag()
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

    expect(repository.createMetadonnee).toHaveBeenCalledWith(
      metadonnee,
      undefined
    );
    expect(repository.getMetadonnee).toHaveBeenCalledWith(
      'insee',
      '2026',
      undefined
    );
    expect(repository.upsertSource).toHaveBeenCalledWith(source, undefined);
    expect(repository.listSources).toHaveBeenCalledOnce();
  });

  it('masque la source snbc3 sans le feature flag', async () => {
    const sources = [
      { id: 'snbc', libelle: 'SNBC' },
      { id: 'snbc3', libelle: 'SNBC3' },
    ];
    const repository = {
      listAvailableSources: vi.fn().mockResolvedValue(sources),
    } as unknown as IndicateurSourcesRepository;
    const permissionService = {
      isAllowed: vi.fn().mockResolvedValue(success(undefined)),
    } as unknown as PermissionService;

    const sansFlag = new IndicateurSourcesService(
      repository,
      permissionService,
      featureFlag(false)
    );
    await expect(
      sansFlag.getAvailableSources(input, { user })
    ).resolves.toEqual(success([sources[0]]));

    const avecFlag = new IndicateurSourcesService(
      repository,
      permissionService,
      featureFlag(true)
    );
    await expect(
      avecFlag.getAvailableSources(input, { user })
    ).resolves.toEqual(success(sources));
  });
});
