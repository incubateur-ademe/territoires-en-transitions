import { ActionTypeEnum } from '@/backend/referentiels/index-domain';
import { referentielDefinitionTable } from '@/backend/referentiels/models/referentiel-definition.table';
import { getActionTypeFromActionId } from '@/backend/referentiels/referentiels.utils';
import {
  getAuthUser,
  getTestApp,
  getTestDatabase,
  getTestRouter,
  YOLO_DODO,
} from '@/backend/test';
import { AuthenticatedUser } from '@/backend/users/index-domain';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { eq } from 'drizzle-orm';
import {
  ReferentielIdEnum,
  referentielIdEnumSchema,
} from '../../models/referentiel-id.enum';
import { createAudit } from '../labellisations.test-fixture';
import { MesureAuditStatutEnum } from './mesure-audit-statut.table';

describe('ListMesureAuditStatutsService', () => {
  let router: TrpcRouter;
  let user: AuthenticatedUser;
  let databaseService: DatabaseService;

  const referentielId = referentielIdEnumSchema.enum.cae;
  const collectiviteId = YOLO_DODO.collectiviteId.edition;

  beforeAll(async () => {
    const app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);
    user = await getAuthUser(YOLO_DODO);
  });

  test("listMesureAuditStatuts retourne une erreur si pas d'audit en cours", async () => {
    const caller = router.createCaller({ user });

    await expect(
      caller.referentiels.labellisations.listMesureAuditStatuts({
        collectiviteId,
        referentielId,
      })
    ).rejects.toThrow('Aucun audit en cours trouvé');
  });

  test('listMesureAuditStatuts retourne les mesures avec leurs statuts existants', async () => {
    const caller = router.createCaller({ user });

    // Créer un audit en cours
    const auditEnCours = await createAudit({
      databaseService,
      collectiviteId,
      referentielId,
      withAuditeurId: user.id,
    });

    // Créer quelques statuts de test
    const statut1 = {
      auditId: auditEnCours.id,
      collectiviteId,
      mesureId: 'cae_1.1',
      statut: MesureAuditStatutEnum.EN_COURS,
      avis: 'Avis test 1',
      ordreDuJour: true,
    };

    const statut2 = {
      auditId: auditEnCours.id,
      collectiviteId,
      mesureId: 'cae_1',
      statut: MesureAuditStatutEnum.AUDITE,
      avis: 'Avis test 2',
      ordreDuJour: false,
    };

    await caller.referentiels.labellisations.updateMesureAuditStatut(statut1);
    await caller.referentiels.labellisations.updateMesureAuditStatut(statut2);

    const result =
      await caller.referentiels.labellisations.listMesureAuditStatuts({
        collectiviteId,
        referentielId,
      });

    // Vérifier que le résultat contient des mesures
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);

    // Vérifier que les mesures avec statuts existants ont les bons statuts
    const mesure1 = result.find((m) => m.mesureId === statut1.mesureId);
    expect(mesure1).toMatchObject(statut1);

    const mesure2 = result.find((m) => m.mesureId === statut2.mesureId);
    expect(mesure2).toMatchObject(statut2);

    // Vérifier que les autres mesures ont le statut par défaut
    const autresMesures = result.filter(
      (m) => !['cae_1.1', 'cae_1'].includes(m.mesureId)
    );

    autresMesures.forEach((mesure) => {
      expect(mesure).toMatchObject({
        collectiviteId,
        auditId: auditEnCours.id,
        statut: MesureAuditStatutEnum.NON_AUDITE,
        avis: '',
        ordreDuJour: false,
        mesureId: expect.stringMatching(/^cae/),
      });
    });
  });

  test.each([ReferentielIdEnum.CAE, ReferentielIdEnum.ECI])(
    'listMesureAuditStatuts ne retourne que les mesures de niveau >= ACTION',
    async (referentielId) => {
      const caller = router.createCaller({ user });

      const [referentielDefinition] = await databaseService.db
        .select()
        .from(referentielDefinitionTable)
        .where(eq(referentielDefinitionTable.id, referentielId));

      if (!referentielDefinition) {
        expect.fail(`Referentiel ${referentielId} non trouvé`);
      }

      // Créer un audit en cours pour CAE
      await createAudit({
        databaseService,
        collectiviteId,
        referentielId,
        withAuditeurId: user.id,
      });

      const result =
        await caller.referentiels.labellisations.listMesureAuditStatuts({
          collectiviteId,
          referentielId,
        });

      expect(result.length).toBeGreaterThan(0);

      // Vérifier que toutes les mesures ne descendent pas en dessous de la mesure
      result.forEach((mesure) => {
        const mesureType = getActionTypeFromActionId(
          mesure.mesureId,
          referentielDefinition.hierarchie
        );

        expect(mesureType).not.toBeOneOf([
          ActionTypeEnum.TACHE,
          ActionTypeEnum.SOUS_ACTION,
        ]);
      });

      // Vérifier qu'il existe au moins une mesure de type "mesure"
      const mesures = result.filter(
        (mesure) =>
          getActionTypeFromActionId(
            mesure.mesureId,
            referentielDefinition.hierarchie
          ) === ActionTypeEnum.ACTION
      );

      expect(mesures.length).toBeGreaterThan(0);
    }
  );

  test("listMesureAuditStatuts retourne une erreur si l'utilisateur n'a pas les permissions", async () => {
    const caller = router.createCaller({ user });

    // Créer un audit en cours
    await createAudit({
      databaseService,
      collectiviteId,
      referentielId,
    });

    // Tester avec une collectivité différente (sans permissions)
    await expect(
      caller.referentiels.labellisations.listMesureAuditStatuts({
        collectiviteId: 99,
        referentielId,
      })
    ).rejects.toThrow();
  });
});
