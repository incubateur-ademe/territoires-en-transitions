import {
  coverTestDocumentsPcaet,
  createDemarche,
} from '@tet/backend/demarches/pcaet/demarches-pcaet.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import {
  addTestUser,
  addUserRoleSupport,
} from '@tet/backend/users/users/users.test-fixture';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { eq } from 'drizzle-orm';
import { INestApplication } from '@nestjs/common';
import { FindUserService } from './find-user/find-user.service';
import { GetCollectiviteService } from './get-collectivite/get-collectivite.service';
import { GetDemarchePcaetService } from './get-demarche-pcaet/get-demarche-pcaet.service';
import { GetReferentielScoresService } from './get-referentiel-scores/get-referentiel-scores.service';
import { ListCollectivitePlansService } from './list-plans/list-plans.service';
import { SUPER_ADMIN_REQUIRED_MESSAGE } from './shared/collectivite-access.service';

describe('Outils MCP métier', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let superAdmin: AuthenticatedUser;
  let supportSansMode: AuthenticatedUser;
  let collectiviteId: number;
  let collectiviteNom: string;
  let demarcheId: number;
  let membre: { email: string; prenom: string; nom: string };
  let planId: number;

  const supportUser = async ({
    superAdminMode,
  }: {
    superAdminMode: boolean;
  }): Promise<AuthenticatedUser> => {
    // Non vérifié : sans le mode super admin, seul le rôle SUPPORT compte.
    const { user } = await addTestUser(db, { verified: false });
    await addUserRoleSupport({
      databaseService: db,
      userId: user.id,
      isSupport: true,
      isSuperAdminRoleEnabled: superAdminMode,
    });
    return getAuthUserFromUserCredentials(user);
  };

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    const router = await getTestRouter(app);

    const fixture = await createDemarche(db, router);
    collectiviteId = fixture.collectiviteId;
    collectiviteNom = fixture.collectivite.nom;
    demarcheId = fixture.demarche.id;
    const [dcp] = await db.db
      .select({
        email: dcpTable.email,
        prenom: dcpTable.prenom,
        nom: dcpTable.nom,
      })
      .from(dcpTable)
      .where(eq(dcpTable.id, fixture.user.id));
    membre = dcp;

    const plan = await fixture.caller.plans.plans.create({
      nom: 'Plan climat test MCP',
      collectiviteId,
    });
    planId = plan.id;
    const action = await fixture.caller.plans.fiches.create({
      fiche: { collectiviteId, titre: 'Action A', statut: 'En cours' },
      ficheFields: { axes: [{ id: plan.id }] },
    });
    await fixture.caller.plans.fiches.create({
      fiche: { collectiviteId, titre: 'Action B', statut: 'Réalisé' },
      ficheFields: { axes: [{ id: plan.id }] },
    });
    // Sous-action : exclue des statuts et de l'activité.
    await fixture.caller.plans.fiches.create({
      fiche: { collectiviteId, titre: 'Sous-action A1', parentId: action.id },
    });

    superAdmin = await supportUser({ superAdminMode: true });
    supportSansMode = await supportUser({ superAdminMode: false });
  });

  describe('get_collectivite', () => {
    test('super admin : identité, membres et plans', async () => {
      const result = await app
        .get(GetCollectiviteService)
        .run({ collectiviteId }, { user: superAdmin });

      expect(result).toMatchObject({
        success: true,
        data: {
          collectiviteId,
          nom: collectiviteNom,
          accesRestreint: false,
          plans: expect.any(Number),
        },
      });
      expect(result.success && result.data.membresActifs).toBeGreaterThan(0);
      expect(result.success && result.data.plans).toBeGreaterThan(0);
    });

    test('support sans mode super admin : refus avec la marche à suivre', async () => {
      const result = await app
        .get(GetCollectiviteService)
        .run({ collectiviteId }, { user: supportSansMode });

      expect(result).toMatchObject({ success: false, error: 'UNAUTHORIZED' });
      expect(!result.success && result.cause?.message).toBe(
        SUPER_ADMIN_REQUIRED_MESSAGE
      );
    });

    test('collectivité inconnue : NOT_FOUND', async () => {
      const result = await app
        .get(GetCollectiviteService)
        .run({ collectiviteId: 999_999_999 }, { user: superAdmin });

      expect(result).toMatchObject({ success: false, error: 'NOT_FOUND' });
    });
  });

  describe('list_plans', () => {
    test('statuts et activité, sous-actions exclues', async () => {
      const result = await app
        .get(ListCollectivitePlansService)
        .run({ collectiviteId }, { user: superAdmin });

      expect(result.success).toBe(true);
      const plan = result.success
        ? result.data.plans.find((p) => p.planId === planId)
        : undefined;
      expect(plan).toMatchObject({
        nom: 'Plan climat test MCP',
        fichesParStatut: { 'En cours': 1, Réalisé: 1 },
        fichesModifiees90Jours: 2,
        derniereModificationFiche: expect.any(String),
      });
    });

    test('support sans mode super admin : refus', async () => {
      const result = await app
        .get(ListCollectivitePlansService)
        .run({ collectiviteId }, { user: supportSansMode });

      expect(result).toMatchObject({ success: false, error: 'UNAUTHORIZED' });
    });
  });

  describe('get_demarche_pcaet', () => {
    test('démarche en élaboration : étape, pilotes, pièces manquantes, conditions bloquantes', async () => {
      const result = await app
        .get(GetDemarchePcaetService)
        .run({ collectiviteId }, { user: superAdmin });

      expect(result).toMatchObject({
        success: true,
        data: {
          demarche: {
            demarcheId,
            status: 'en_elaboration',
            etape: 'elaboration',
            enCours: true,
          },
          documents: { dossierComplet: false },
        },
      });
      if (!result.success) return;
      expect(result.data.documents.attendus.length).toBeGreaterThan(0);
      expect(
        result.data.documents.attendus.some((d) => d.requis && !d.couvert)
      ).toBe(true);
      expect(
        result.data.demarche.transitions.some((t) =>
          t.bloqueePar.includes('dossierComplet')
        )
      ).toBe(true);
    });

    test('pièces déposées : la couverture suit', async () => {
      await coverTestDocumentsPcaet(db, { collectiviteId, demarcheId });

      const result = await app
        .get(GetDemarchePcaetService)
        .run({ collectiviteId }, { user: superAdmin });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(
        result.data.documents.attendus
          .filter((d) => d.requis && d.etape !== 'aval')
          .every((d) => d.couvert)
      ).toBe(true);
    });

    test('support sans mode super admin : refus', async () => {
      const result = await app
        .get(GetDemarchePcaetService)
        .run({ collectiviteId }, { user: supportSansMode });

      expect(result).toMatchObject({ success: false, error: 'UNAUTHORIZED' });
    });
  });

  describe('get_referentiel_scores', () => {
    test('points et pourcentages, ou score indisponible', async () => {
      const result = await app
        .get(GetReferentielScoresService)
        .run({ collectiviteId, referentielId: 'cae' }, { user: superAdmin });

      if (result.success) {
        expect(result.data).toMatchObject({
          referentielId: 'cae',
          pointPotentiel: expect.any(Number),
        });
      } else {
        expect(result.error).toBe('SNAPSHOT_NOT_FOUND');
      }
    });

    test('support sans mode super admin : refus', async () => {
      const result = await app
        .get(GetReferentielScoresService)
        .run(
          { collectiviteId, referentielId: 'cae' },
          { user: supportSansMode }
        );

      expect(result).toMatchObject({ success: false, error: 'UNAUTHORIZED' });
    });
  });

  describe('find_user', () => {
    test('par e-mail, sans tenir compte de la casse, sans e-mail ni téléphone en sortie', async () => {
      const result = await app
        .get(FindUserService)
        .run({ email: membre.email.toUpperCase() }, { user: superAdmin });

      expect(result).toMatchObject({
        success: true,
        data: {
          prenom: membre.prenom,
          nom: membre.nom,
          compteActif: true,
          collectivitesMasquees: 0,
          collectivites: [
            expect.objectContaining({ collectiviteId, nom: collectiviteNom }),
          ],
        },
      });
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain(membre.email);
      expect(serialized).not.toContain('telephone');
      expect(serialized).not.toContain('userId');
    });

    test('e-mail inconnu : NOT_FOUND', async () => {
      const result = await app
        .get(FindUserService)
        .run({ email: 'personne@exemple.invalid' }, { user: superAdmin });

      expect(result).toMatchObject({ success: false, error: 'NOT_FOUND' });
    });

    test('support sans mode super admin : refus', async () => {
      const result = await app
        .get(FindUserService)
        .run({ email: membre.email }, { user: supportSansMode });

      expect(result).toMatchObject({ success: false, error: 'UNAUTHORIZED' });
    });
  });
});
