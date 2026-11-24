import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { CloreInstructionService } from '../clore-instruction/clore-instruction.service';
import { NotifyAvisRecuService } from '../notifications/notify-avis-recu/notify-avis-recu.service';
import { DepotPermissionsService } from '../shared/depot-permissions.service';
import { PcaetAvisRepository } from '../shared/pcaet-avis.repository';
import { DemarchePcaetTrackingService } from '../shared/tracking/demarche-pcaet-tracking.service';
import { ValiderAvisService } from './valider-avis.service';

const tx = {} as Transaction;
const user = { id: 'user-1' } as AuthenticatedUser;
const input = { demandeAvisId: 12, avisId: 'avis-1' };
const brouillon = {
  id: 'avis-1',
  auTitreDe: 'prefet_region',
  fichierRefs: ['piece'],
  valideLe: null,
};
const avisValide = { ...brouillon, valideLe: '2026-11-24T10:00:00.000Z' };
const cible = { collectiviteId: 1, demarcheId: 7 };

const makeService = ({ clore }: { clore: ReturnType<typeof vi.fn> }) => {
  const transactionManager = {
    executeSingle: vi.fn(
      async (operation: (transaction: Transaction) => Promise<unknown>) =>
        operation(tx)
    ),
  } as unknown as TransactionManager;
  const depotPermissionsService = {
    canDeposerAvis: vi.fn().mockResolvedValue(success({ cible })),
  } as unknown as DepotPermissionsService;
  const pcaetAvisRepository = {
    findById: vi.fn().mockResolvedValue(brouillon),
    valider: vi.fn().mockResolvedValue(undefined),
    getDemarcheCible: vi.fn().mockResolvedValue(cible),
    listByDemande: vi.fn().mockResolvedValue([avisValide]),
  };
  const cloreInstructionService = {
    clore,
  } as unknown as CloreInstructionService;
  const notifyAvisRecuService = {
    creerNotifications: vi.fn().mockResolvedValue(undefined),
  } as unknown as NotifyAvisRecuService;
  const trackingService = {
    trackInstructeur: vi.fn(),
  };
  const service = new ValiderAvisService(
    transactionManager,
    depotPermissionsService,
    pcaetAvisRepository as unknown as PcaetAvisRepository,
    cloreInstructionService,
    notifyAvisRecuService,
    trackingService as unknown as DemarchePcaetTrackingService
  );
  return { service, pcaetAvisRepository, trackingService };
};

describe('ValiderAvisService', () => {
  it('garde l’avis validé et le signale quand la clôture de l’instruction échoue', async () => {
    const clore = vi
      .fn()
      .mockResolvedValue(failure('DATABASE_ERROR', new Error('clôture')));
    const { service, pcaetAvisRepository, trackingService } = makeService({
      clore,
    });

    const result = await service.validerAvis(input, { user, tx });

    expect(result).toEqual(success([avisValide]));
    expect(pcaetAvisRepository.valider).toHaveBeenCalledWith(input, tx);
    expect(trackingService.trackInstructeur).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        properties: expect.objectContaining({ instructionClose: false }),
      })
    );
  });

  it('signale la clôture quand elle réussit', async () => {
    const clore = vi.fn().mockResolvedValue(success({ status: 'instruit' }));
    const { service, trackingService } = makeService({ clore });

    await service.validerAvis(input, { user, tx });

    expect(trackingService.trackInstructeur).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        properties: expect.objectContaining({ instructionClose: true }),
      })
    );
  });
});
