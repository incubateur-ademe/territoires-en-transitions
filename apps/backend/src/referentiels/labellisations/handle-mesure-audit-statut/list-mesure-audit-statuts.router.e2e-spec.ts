import {
  getAuthUser,
  getTestApp,
  getTestDatabase,
  getTestRouter,
  YOLO_DODO,
} from '@/backend/test';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { ActionTypeEnum } from '../../models/action-type.enum';
import {
  addAuditeurPermission,
  createAudit,
} from '../labellisations.test-fixture';
import {
  MesureAuditStatutEnum,
  mesureAuditStatutTable,
} from './mesure-audit-statut.table';

const collectiviteId = 34 as const;
const referentielId = 'cae' as const;

describe('listMesureAuditStatuts.router', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    const app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);
    yoloDodoUser = await getAuthUser();
  });

  test('should return all measures with their audit status, including measures without defined statuses', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const { audit: auditEnCours } = await createAudit({
      databaseService,
      collectiviteId,
      referentielId,
    });

    addAuditeurPermission({
      databaseService,
      auditId: auditEnCours.id,
      userId: yoloDodoUser.id,
    });

    // Crée des statuts pour deux mesures spécifiques
    const mesureAuditStatusCae111 = {
      auditId: auditEnCours.id,
      collectiviteId,
      mesureId: 'cae_1.1.1',
      statut: MesureAuditStatutEnum.AUDITE,
      avis: 'Avis positif pour action 1.1.1',
      ordreDuJour: true,
      modifiedBy: yoloDodoUser.id,
    };

    const mesureAuditStatusCae21 = {
      auditId: auditEnCours.id,
      collectiviteId,
      mesureId: 'cae_2.1',
      statut: MesureAuditStatutEnum.EN_COURS,
      avis: "En cours d'audit pour sous-axe 2.1",
      ordreDuJour: false,
      modifiedBy: yoloDodoUser.id,
    };

    const mesureAuditStatuses = [
      mesureAuditStatusCae111,
      mesureAuditStatusCae21,
    ];

    await databaseService.db
      .insert(mesureAuditStatutTable)
      .values(mesureAuditStatuses);

    const input = {
      collectiviteId,
      referentielId,
    };

    const result =
      await caller.referentiels.labellisations.listMesureAuditStatuts(input);

    expect(result.length).toBeGreaterThan(mesureAuditStatuses.length);

    // Verify all expected measures are present
    const expectedMesureIds = [
      'cae_1',
      'cae_1.1',
      'cae_1.1.1',
      'cae_2',
      'cae_2.1',
      'cae_2.2',
      'cae_2.2.1',
      'cae_2.3',
      'cae_6.1.1',
    ];
    const resultMeasureIds = result.map((m) => m.mesureId);
    expect(resultMeasureIds).toEqual(expect.arrayContaining(expectedMesureIds));

    // Vérifie que les mesures sans statut ont les valeurs par défaut
    const measureWithoutStatus = result.find((m) => m.mesureId === 'cae_1');
    expect(measureWithoutStatus).toBeDefined();
    expect(measureWithoutStatus?.statut).toBe(MesureAuditStatutEnum.NON_AUDITE);
    expect(measureWithoutStatus?.avis).toBe('');
    expect(measureWithoutStatus?.ordreDuJour).toBe(false);
    expect(measureWithoutStatus?.mesureType).toBe(ActionTypeEnum.AXE);
    expect(measureWithoutStatus?.mesureNom).toBeDefined();

    // Vérifie que les mesures avec statut ont les valeurs correctes
    const measureWithStatus = result.find(
      (m) => m.mesureId === mesureAuditStatusCae111.mesureId
    );
    expect(measureWithStatus).toBeDefined();
    expect(measureWithStatus?.statut).toBe(mesureAuditStatusCae111.statut);
    expect(measureWithStatus?.avis).toBe(mesureAuditStatusCae111.avis);
    expect(measureWithStatus?.ordreDuJour).toBe(
      mesureAuditStatusCae111.ordreDuJour
    );
    expect(measureWithStatus?.mesureType).toBe(ActionTypeEnum.ACTION);
    expect(measureWithStatus?.mesureNom).toBeDefined();

    // Check another measure with different status
    const measureInProgress = result.find(
      (m) => m.mesureId === mesureAuditStatusCae21.mesureId
    );
    expect(measureInProgress).toBeDefined();
    expect(measureInProgress?.statut).toBe(mesureAuditStatusCae21.statut);
    expect(measureInProgress?.avis).toBe(mesureAuditStatusCae21.avis);
    expect(measureInProgress?.ordreDuJour).toBe(
      mesureAuditStatusCae21.ordreDuJour
    );
    expect(measureInProgress?.mesureType).toBe(ActionTypeEnum.SOUS_AXE);
    expect(measureInProgress?.mesureNom).toBeDefined();

    let previousMesureId = 'cae_0';

    for (const mesure of result) {
      expect(mesure.auditId).toBe(auditEnCours.id);
      expect(mesure.collectiviteId).toBe(collectiviteId);
      expect(mesure.mesureId).toMatch(/^cae_/);

      // Vérifie que les identifiants sont dans l'ordre
      expect(mesure.mesureId.localeCompare(previousMesureId)).toBe(1);
      previousMesureId = mesure.mesureId;

      //  Vérifie que les types de mesure correspondent uniquement à AXE, SOUS_AXE et ACTION
      expect([
        ActionTypeEnum.AXE,
        ActionTypeEnum.SOUS_AXE,
        ActionTypeEnum.ACTION,
      ]).toContain(mesure.mesureType);

      expect([
        ActionTypeEnum.SOUS_ACTION,
        ActionTypeEnum.TACHE,
        ActionTypeEnum.EXEMPLE,
      ]).not.toContain(mesure.mesureType);
    }
  });

  test('should throw error when not authenticated', async () => {
    const caller = router.createCaller({ user: null });
    const input = {
      collectiviteId,
      referentielId,
    };

    await expect(() =>
      caller.referentiels.labellisations.listMesureAuditStatuts(input)
    ).rejects.toThrowError(/not authenticated/i);
  });

  test('should throw error when no audit is in progress', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const input = {
      collectiviteId: YOLO_DODO.collectiviteId.id,
      referentielId,
    };

    await expect(() =>
      caller.referentiels.labellisations.listMesureAuditStatuts(input)
    ).rejects.toThrowError(/Aucun audit en cours trouvé/);
  });
});
