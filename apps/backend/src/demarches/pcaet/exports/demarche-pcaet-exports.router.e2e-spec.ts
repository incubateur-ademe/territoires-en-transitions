import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { demarchePcaetCollectiviteCouverteTable } from '@tet/backend/demarches/shared/models/demarche-pcaet-collectivite-couverte.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import {
  getAuthToken,
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
  signTestAuthToken,
} from '@tet/backend/test';
import {
  AuthRole,
  type AuthenticatedUser,
} from '@tet/backend/users/models/auth.models';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import { Workbook } from 'exceljs';
import request from 'supertest';
import {
  addTestFichePcaet,
  attachTestPlanToDemarchePcaet,
  completeTestDiagnosticPcaet,
  completeTestDossierPcaet,
  listTestWorksheetTexts,
  pickFreeRegionCode,
  publierTestDemarchePcaet,
} from '../demarches-pcaet.test-fixture';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';
import { BuildOnDemandPcaetExportService } from './build-on-demand-pcaet-export.service';
import type { DemarchePcaetExportRef } from './demarche-pcaet-exports.input';

const PLAN_NOM = 'Plan climat';
const FICHE_VISIBLE = 'Rénover les écoles';
const FICHE_RESTREINTE = 'Fiche confidentielle';

describe('Classeurs du dépôt PCAET (demarches.pcaet.exports)', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: TrpcRouter;

  /** Une DREAL et son agente, dans une région libre : la transmission la saisit. */
  let regionCode: string;
  let drealUser: AuthenticatedUser;
  let drealId: number;
  /** Une DREAL d'une autre région : jamais saisie. */
  let autreDrealUser: AuthenticatedUser;

  /** Une DREAL dans une région libre, et son agente. */
  const addTestDreal = async (nom: string) => {
    const regionCode = await pickFreeRegionCode(db, 'dreal');
    const dreal = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.LECTURE },
      collectivite: { type: 'dreal', regionCode, nom },
    });
    return { ...dreal, regionCode };
  };

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    router = await getTestRouter(app);

    const dreal = await addTestDreal('DREAL test exports');
    regionCode = dreal.regionCode;
    drealUser = getAuthUserFromUserCredentials(dreal.user);
    drealId = dreal.collectivite.id;

    // Si la seconde échoue, le teardown n'est jamais enregistré : la première
    // est libérée ici, pour que sa région ne reste pas prise.
    const autreDreal = await addTestDreal(
      'DREAL test exports hors périmètre'
    ).catch(async (error) => {
      await dreal.cleanup();
      throw error;
    });
    autreDrealUser = getAuthUserFromUserCredentials(autreDreal.user);

    return async () => {
      await db.db
        .delete(pcaetDemandeAvisTable)
        .where(eq(pcaetDemandeAvisTable.instructeurCollectiviteId, drealId));
      await autreDreal.cleanup();
      await dreal.cleanup();
      await app.close();
    };
  });

  /**
   * Un dépôt complet, déposé dans la région de la DREAL, avec un plan « Plan
   * climat » qui porte une fiche visible et, au choix, une fiche restreinte.
   */
  const createDepot = async ({
    withFicheRestreinte = true,
  }: { withFicheRestreinte?: boolean } = {}) => {
    const fixture = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
      collectivite: { regionCode, nom: 'Agglo test exports' },
    });
    const user = getAuthUserFromUserCredentials(fixture.user);
    const caller = router.createCaller({ user });
    const collectiviteId = fixture.collectivite.id;
    const demarche = await caller.demarches.pcaet.create({ collectiviteId });
    const demarcheId = demarche.id;
    await completeTestDossierPcaet(db, { collectiviteId, demarcheId });
    const plan = await attachTestPlanToDemarchePcaet(db, {
      collectiviteId,
      demarcheId,
      nom: PLAN_NOM,
    });
    await addTestFichePcaet(caller, {
      collectiviteId,
      titre: FICHE_VISIBLE,
      axeId: plan.id,
    });
    const restreinteId = withFicheRestreinte
      ? await addTestFichePcaet(caller, {
          collectiviteId,
          titre: FICHE_RESTREINTE,
          restreint: true,
          axeId: plan.id,
        })
      : null;

    return { user, caller, collectiviteId, demarcheId, plan, restreinteId };
  };

  const transmettre = async ({
    caller,
    collectiviteId,
    demarcheId,
  }: {
    caller: ReturnType<TrpcRouter['createCaller']>;
    collectiviteId: number;
    demarcheId: number;
  }): Promise<number> => {
    await caller.demarches.pcaet.transmettrePourAvis({
      collectiviteId,
      demarcheId,
    });
    const [demande] = await db.db
      .select({ id: pcaetDemandeAvisTable.id })
      .from(pcaetDemandeAvisTable)
      .where(
        and(
          eq(pcaetDemandeAvisTable.demarcheId, demarcheId),
          eq(pcaetDemandeAvisTable.instructeurCollectiviteId, drealId)
        )
      );
    if (!demande) {
      throw new Error(
        `La DREAL de test n'a pas été saisie (démarche ${demarcheId})`
      );
    }
    return demande.id;
  };

  /** Un membre d'un EPCI que couvre le dépôt : il lit sans fiche restreinte. */
  const addMembreCouvert = async (demarcheId: number) => {
    const epci = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.LECTURE },
      collectivite: { natureInsee: 'CC', nom: 'CC test exports couverte' },
    });
    await db.db
      .insert(demarchePcaetCollectiviteCouverteTable)
      .values({ demarcheId, collectiviteId: epci.collectivite.id });
    const user = getAuthUserFromUserCredentials(epci.user);
    return { user, caller: router.createCaller({ user }), epci };
  };

  /** Télécharge le classeur figé par le lien signé, tel que le front le fera. */
  const downloadSnapshot = async (
    caller: ReturnType<TrpcRouter['createCaller']>,
    input: DemarchePcaetExportRef & { type: 'plan' | 'indicateurs' }
  ) => {
    const { url, filename } =
      await caller.demarches.pcaet.exports.getDownloadUrl(input);
    const response = await fetch(url);
    expect(response.status).toBe(200);
    const workbook = new Workbook();
    await workbook.xlsx.load(await response.arrayBuffer());
    return { workbook, filename };
  };

  const buildOnDemand = async (
    user: AuthenticatedUser,
    ref: DemarchePcaetExportRef,
    type: 'plan' | 'indicateurs'
  ) => {
    const result = await app
      .get(BuildOnDemandPcaetExportService)
      .build({ ref, type }, { user });
    if (!result.success) {
      return result;
    }
    const workbook = new Workbook();
    await workbook.xlsx.load(result.data.buffer as unknown as ArrayBuffer);
    return { ...result, workbook };
  };

  /**
   * Simule un dépôt publié avant la génération à la soumission : aucun export
   * figé.
   */
  const setStatusWithoutExports = (demarcheId: number, status: 'publie') =>
    db.db
      .update(demarcheTable)
      .set({ status })
      .where(eq(demarcheTable.id, demarcheId));

  describe('accès', () => {
    test("l'instructeur saisi reçoit l'export figé complet, une DREAL hors périmètre est refusée", async () => {
      const depot = await createDepot();
      const demandeAvisId = await transmettre(depot);

      const drealCaller = router.createCaller({ user: drealUser });
      expect(
        await drealCaller.demarches.pcaet.exports.list({ demandeAvisId })
      ).toEqual({
        plan: {
          source: 'snapshot',
          transition: 'transmettre_pour_avis',
          createdAt: expect.any(String),
        },
        indicateurs: {
          source: 'snapshot',
          transition: 'transmettre_pour_avis',
          createdAt: expect.any(String),
        },
      });
      const { workbook, filename } = await downloadSnapshot(drealCaller, {
        demandeAvisId,
        type: 'plan',
      });
      expect(filename).toMatch(/_Plan_transmis-pour-avis_/);
      expect(listTestWorksheetTexts(workbook, PLAN_NOM)).toContain(
        FICHE_RESTREINTE
      );

      const autreCaller = router.createCaller({ user: autreDrealUser });
      await expect(
        autreCaller.demarches.pcaet.exports.list({ demandeAvisId })
      ).rejects.toThrow(/permissions/);
      await expect(
        autreCaller.demarches.pcaet.exports.getDownloadUrl({
          demandeAvisId,
          type: 'plan',
        })
      ).rejects.toThrow(/permissions/);
    });

    test('refuse un utilisateur sans lien avec la collectivité déposante', async () => {
      const depot = await createDepot({ withFicheRestreinte: false });
      await transmettre(depot);

      const tiersCaller = router.createCaller({ user: autreDrealUser });
      await expect(
        tiersCaller.demarches.pcaet.exports.list({
          demarcheId: depot.demarcheId,
          collectiviteId: depot.collectiviteId,
        })
      ).rejects.toThrow(/permissions/);
    });
  });

  describe('membre d’un EPCI couvert', () => {
    test('reçoit le plan sans les fiches restreintes, et les indicateurs', async () => {
      const depot = await createDepot();
      await transmettre(depot);
      const membre = await addMembreCouvert(depot.demarcheId);
      const ref = {
        demarcheId: depot.demarcheId,
        collectiviteId: depot.collectiviteId,
      };

      const { workbook } = await downloadSnapshot(membre.caller, {
        ...ref,
        type: 'plan',
      });
      const textes = listTestWorksheetTexts(workbook, PLAN_NOM);
      expect(textes).toContain(FICHE_VISIBLE);
      expect(textes).not.toContain(FICHE_RESTREINTE);

      const indicateurs = await downloadSnapshot(membre.caller, {
        ...ref,
        type: 'indicateurs',
      });
      expect(indicateurs.workbook.worksheets.map(({ name }) => name)).toEqual([
        'Indicateurs',
        'Vulnérabilité',
      ]);

      // La déposante, elle, reçoit le plan complet.
      const complet = await downloadSnapshot(depot.caller, {
        ...ref,
        type: 'plan',
      });
      expect(listTestWorksheetTexts(complet.workbook, PLAN_NOM)).toContain(
        FICHE_RESTREINTE
      );
    });

    test('reçoit le plan complet quand aucune fiche n’est restreinte', async () => {
      const depot = await createDepot({ withFicheRestreinte: false });
      await transmettre(depot);
      const membre = await addMembreCouvert(depot.demarcheId);

      const { workbook } = await downloadSnapshot(membre.caller, {
        demarcheId: depot.demarcheId,
        collectiviteId: depot.collectiviteId,
        type: 'plan',
      });
      expect(listTestWorksheetTexts(workbook, PLAN_NOM)).toContain(
        FICHE_VISIBLE
      );
    });

    test('après publication, reçoit le plan de la publication et non la variante de la transmission', async () => {
      const depot = await createDepot();
      await transmettre(depot);
      // Rendue visible entre la transmission et la publication : la
      // publication ne produit pas de variante.
      await db.db
        .update(ficheActionTable)
        .set({ restreint: false })
        .where(eq(ficheActionTable.id, depot.restreinteId as number));
      await publierTestDemarchePcaet(app, db, depot.caller, depot);
      const membre = await addMembreCouvert(depot.demarcheId);
      const ref = {
        demarcheId: depot.demarcheId,
        collectiviteId: depot.collectiviteId,
      };

      expect(await membre.caller.demarches.pcaet.exports.list(ref)).toEqual({
        plan: {
          source: 'snapshot',
          transition: 'publier',
          createdAt: expect.any(String),
        },
        indicateurs: {
          source: 'snapshot',
          transition: 'publier',
          createdAt: expect.any(String),
        },
      });
      const { workbook, filename } = await downloadSnapshot(membre.caller, {
        ...ref,
        type: 'plan',
      });
      expect(filename).toMatch(/_Plan_publie_/);
      expect(listTestWorksheetTexts(workbook, PLAN_NOM)).toContain(
        FICHE_RESTREINTE
      );
    });
  });

  describe('export figé', () => {
    test("après publication, sert l'export figé de la publication", async () => {
      const depot = await createDepot({ withFicheRestreinte: false });
      const demandeAvisId = await transmettre(depot);
      await publierTestDemarchePcaet(app, db, depot.caller, depot);

      const list = await router
        .createCaller({ user: drealUser })
        .demarches.pcaet.exports.list({ demandeAvisId });
      expect(list.plan).toMatchObject({
        source: 'snapshot',
        transition: 'publier',
      });
      expect(list.indicateurs).toMatchObject({
        source: 'snapshot',
        transition: 'publier',
      });
    });

    test("refuse l'export du jour dès qu'un export figé existe", async () => {
      const depot = await createDepot({ withFicheRestreinte: false });
      await transmettre(depot);

      const result = await app.get(BuildOnDemandPcaetExportService).build(
        {
          ref: {
            demarcheId: depot.demarcheId,
            collectiviteId: depot.collectiviteId,
          },
          type: 'plan',
        },
        { user: depot.user }
      );
      expect(result).toMatchObject({
        success: false,
        error: 'ON_DEMAND_EXPORT_NOT_AVAILABLE',
      });
    });
  });

  describe('dépôt en élaboration', () => {
    test("ne propose aucun classeur et refuse l'export du jour", async () => {
      const depot = await createDepot({ withFicheRestreinte: false });
      const ref = {
        demarcheId: depot.demarcheId,
        collectiviteId: depot.collectiviteId,
      };

      expect(await depot.caller.demarches.pcaet.exports.list(ref)).toEqual({
        plan: null,
        indicateurs: null,
      });
      await expect(
        depot.caller.demarches.pcaet.exports.getDownloadUrl({
          ...ref,
          type: 'plan',
        })
      ).rejects.toThrow(/pas de données à exporter/);
      expect(await buildOnDemand(depot.user, ref, 'plan')).toMatchObject({
        success: false,
        error: 'ON_DEMAND_EXPORT_NOT_AVAILABLE',
      });
    });
  });

  describe('dépôt soumis sans export figé : export du jour', () => {
    test('propose les deux classeurs, construits sur les données à ce jour', async () => {
      const depot = await createDepot();
      await setStatusWithoutExports(depot.demarcheId, 'publie');
      const ref = {
        demarcheId: depot.demarcheId,
        collectiviteId: depot.collectiviteId,
      };

      expect(await depot.caller.demarches.pcaet.exports.list(ref)).toEqual({
        plan: { source: 'on_demand' },
        indicateurs: { source: 'on_demand' },
      });
      // Pas de lien signé : il n'y a pas de fichier figé.
      await expect(
        depot.caller.demarches.pcaet.exports.getDownloadUrl({
          ...ref,
          type: 'plan',
        })
      ).rejects.toThrow(/pas de données à exporter/);

      // Une modification faite après la publication se retrouve dans l'export.
      await db.db
        .update(ficheActionTable)
        .set({ titre: 'Rénover les écoles et les gymnases' })
        .where(
          and(
            eq(ficheActionTable.collectiviteId, depot.collectiviteId),
            eq(ficheActionTable.titre, FICHE_VISIBLE)
          )
        );
      const editor = depot.user;
      const onDemand = await buildOnDemand(editor, ref, 'plan');
      if (!('workbook' in onDemand)) {
        throw new Error(`Export du jour refusé : ${onDemand.error}`);
      }
      expect(onDemand.data.filename).toMatch(
        /^PCAET_Agglo test exports_Plan_\d{4}-\d{2}-\d{2}\.xlsx$/
      );
      const textes = listTestWorksheetTexts(onDemand.workbook, PLAN_NOM);
      expect(textes).toContain('Rénover les écoles et les gymnases');
      expect(textes).toContain(FICHE_RESTREINTE);

      const indicateurs = await buildOnDemand(editor, ref, 'indicateurs');
      if (!('workbook' in indicateurs)) {
        throw new Error(`Export du jour refusé : ${indicateurs.error}`);
      }
      expect(indicateurs.data.filename).toMatch(
        /_Indicateurs_\d{4}-\d{2}-\d{2}\.xlsx$/
      );

      // Le membre d'un EPCI couvert ne reçoit pas la fiche restreinte.
      const membre = await addMembreCouvert(depot.demarcheId);
      const onDemandMembre = await buildOnDemand(membre.user, ref, 'plan');
      if (!('workbook' in onDemandMembre)) {
        throw new Error(`Export du jour refusé : ${onDemandMembre.error}`);
      }
      const textesMembre = listTestWorksheetTexts(
        onDemandMembre.workbook,
        PLAN_NOM
      );
      expect(textesMembre).toContain('Rénover les écoles et les gymnases');
      expect(textesMembre).not.toContain(FICHE_RESTREINTE);
    });

    test('le contrôleur rend le classeur en pièce jointe', async () => {
      const fixture = await addTestCollectiviteAndUser(db, {
        user: { role: CollectiviteRole.EDITION },
        collectivite: { regionCode, nom: 'Agglo test exports http' },
      });
      const caller = router.createCaller({
        user: getAuthUserFromUserCredentials(fixture.user),
      });
      const collectiviteId = fixture.collectivite.id;
      const { id: demarcheId } = await caller.demarches.pcaet.create({
        collectiviteId,
      });
      await attachTestPlanToDemarchePcaet(db, {
        collectiviteId,
        demarcheId,
        nom: PLAN_NOM,
      });
      await setStatusWithoutExports(demarcheId, 'publie');
      const token = await getAuthToken({
        email: fixture.user.email ?? '',
        password: fixture.user.password,
      });

      const response = await request(app.getHttpServer())
        .get('/demarches/pcaet/exports/on-demand')
        .query({ demarcheId, collectiviteId, type: 'plan' })
        .set('Authorization', `Bearer ${token}`)
        .responseType('blob')
        .expect(200);
      // Un jeton service_role passe le guard, mais pas le contrôleur.
      const serviceRoleToken = signTestAuthToken(
        { role: AuthRole.SERVICE_ROLE },
        app.get(ConfigurationService).get('SUPABASE_JWT_SECRET')
      );
      await request(app.getHttpServer())
        .get('/demarches/pcaet/exports/on-demand')
        .query({ demarcheId, collectiviteId, type: 'plan' })
        .set('Authorization', `Bearer ${serviceRoleToken}`)
        .expect(401);

      const contentDisposition = response.headers['content-disposition'];
      expect(contentDisposition).toMatch(/^attachment;/);
      const filename = decodeURIComponent(
        contentDisposition.split("filename*=UTF-8''")[1]
      );
      expect(filename).toMatch(
        /^PCAET_Agglo test exports http_Plan_\d{4}-\d{2}-\d{2}\.xlsx$/
      );
      const workbook = new Workbook();
      await workbook.xlsx.load(response.body as ArrayBuffer);
      expect(workbook.worksheets.map(({ name }) => name)).toEqual([PLAN_NOM]);

      // Diagnostic vide : rien à exporter.
      await request(app.getHttpServer())
        .get('/demarches/pcaet/exports/on-demand')
        .query({ demarcheId, collectiviteId, type: 'indicateurs' })
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      // Une clé incomplète est refusée avant toute lecture.
      await request(app.getHttpServer())
        .get('/demarches/pcaet/exports/on-demand')
        .query({ demarcheId, type: 'plan' })
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });

    test('ne propose pas le plan sans plan lié abouti, ni les indicateurs sans diagnostic', async () => {
      const fixture = await addTestCollectiviteAndUser(db, {
        user: { role: CollectiviteRole.EDITION },
      });
      const caller = router.createCaller({
        user: getAuthUserFromUserCredentials(fixture.user),
      });
      const collectiviteId = fixture.collectivite.id;
      const { id: demarcheId } = await caller.demarches.pcaet.create({
        collectiviteId,
      });
      // Un plan lié encore à vérifier ne compte pas.
      await attachTestPlanToDemarchePcaet(db, {
        collectiviteId,
        demarcheId,
        nom: PLAN_NOM,
        status: 'to_verify',
      });
      await setStatusWithoutExports(demarcheId, 'publie');

      expect(
        await caller.demarches.pcaet.exports.list({
          demarcheId,
          collectiviteId,
        })
      ).toEqual({ plan: null, indicateurs: null });
      expect(
        await buildOnDemand(
          getAuthUserFromUserCredentials(fixture.user),
          { demarcheId, collectiviteId },
          'plan'
        )
      ).toMatchObject({ success: false, error: 'EXPORT_NOT_FOUND' });

      await completeTestDiagnosticPcaet(db, { collectiviteId, demarcheId });
      expect(
        await caller.demarches.pcaet.exports.list({
          demarcheId,
          collectiviteId,
        })
      ).toEqual({ plan: null, indicateurs: { source: 'on_demand' } });
    });
  });
});
