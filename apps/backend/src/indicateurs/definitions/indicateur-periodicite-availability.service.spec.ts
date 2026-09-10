import { getServiceRoleUser } from '@tet/backend/test';
import type { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IndicateurPeriodiciteAvailabilityService } from './indicateur-periodicite-availability.service';

describe('IndicateurPeriodiciteAvailabilityService', () => {
  const trackingService = {
    isFeatureEnabled: vi.fn(),
  } as unknown as TrackingService;
  const service = new IndicateurPeriodiciteAvailabilityService(trackingService);

  const context = { user: { id: 'user-id' } as AuthenticatedUser };
  const catalogContext = { user: getServiceRoleUser() };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne un échec lorsque le service de feature flags est indisponible', async () => {
    const cause = new Error('tracking unavailable');
    vi.mocked(trackingService.isFeatureEnabled).mockRejectedValueOnce(cause);

    await expect(
      service.checkAvailable({ periodicite: 'mensuelle' }, context)
    ).resolves.toEqual({ success: false, error: 'SERVER_ERROR', cause });
  });

  it('laisse la périodicité sans activation progressive disponible', async () => {
    await expect(
      service.checkAvailable(
        { periodicite: 'annuelle', collectiviteId: 1 },
        context
      )
    ).resolves.toEqual({ success: true, data: undefined });
    expect(trackingService.isFeatureEnabled).not.toHaveBeenCalled();
  });

  it('refuse une périodicité dont le déploiement fonctionnel est désactivé', async () => {
    vi.mocked(trackingService.isFeatureEnabled).mockResolvedValue(false);

    await expect(
      service.checkAvailable(
        { periodicite: 'mensuelle', collectiviteId: 1 },
        context
      )
    ).resolves.toMatchObject({
      success: false,
      error: 'PERIODICITE_UNAVAILABLE',
    });
  });

  it('accepte une périodicité après son activation fonctionnelle', async () => {
    vi.mocked(trackingService.isFeatureEnabled).mockResolvedValue(true);

    await expect(
      service.checkAvailable(
        { periodicite: 'mensuelle', collectiviteId: 1 },
        context
      )
    ).resolves.toEqual({ success: true, data: undefined });
    expect(trackingService.isFeatureEnabled).toHaveBeenCalledWith(
      'is-indicateur-periodicite-mensuelle-enabled',
      'user-id',
      1
    );
  });

  it('laisse modifier une définition mensuelle sans réattribuer sa cadence', async () => {
    vi.mocked(trackingService.isFeatureEnabled).mockResolvedValue(false);

    await expect(
      service.checkAssignmentAvailable(
        { periodicite: 'mensuelle', current: 'mensuelle', collectiviteId: 1 },
        context
      )
    ).resolves.toEqual({ success: true, data: undefined });
    expect(trackingService.isFeatureEnabled).not.toHaveBeenCalled();
  });

  it('applique le déploiement progressif lors d’un changement de cadence', async () => {
    vi.mocked(trackingService.isFeatureEnabled).mockResolvedValue(false);

    await expect(
      service.checkAssignmentAvailable(
        { periodicite: 'mensuelle', current: 'annuelle', collectiviteId: 1 },
        context
      )
    ).resolves.toMatchObject({
      success: false,
      error: 'PERIODICITE_UNAVAILABLE',
    });
  });

  it('applique le même déploiement progressif aux nouvelles cadences du catalogue', async () => {
    vi.mocked(trackingService.isFeatureEnabled).mockResolvedValue(false);

    await expect(
      service.checkAssignmentAvailable(
        { periodicite: 'mensuelle' },
        catalogContext
      )
    ).resolves.toMatchObject({
      success: false,
      error: 'PERIODICITE_UNAVAILABLE',
    });
    expect(trackingService.isFeatureEnabled).toHaveBeenCalledWith(
      'is-indicateur-periodicite-mensuelle-enabled',
      'indicateur-catalog-import',
      undefined
    );
  });

  it('laisse le catalogue réimporter une cadence déjà attribuée pendant un rollback du flag', async () => {
    vi.mocked(trackingService.isFeatureEnabled).mockResolvedValue(false);

    await expect(
      service.checkAssignmentAvailable(
        { periodicite: 'mensuelle', current: 'mensuelle' },
        catalogContext
      )
    ).resolves.toEqual({ success: true, data: undefined });
    expect(trackingService.isFeatureEnabled).not.toHaveBeenCalled();
  });
});
