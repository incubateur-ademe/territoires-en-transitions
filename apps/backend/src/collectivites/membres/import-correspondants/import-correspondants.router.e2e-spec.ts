import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { pickFreeRegionCode } from '@tet/backend/demarches/pcaet/demarches-pcaet.test-fixture';
import {
  getServiceRoleUser,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { utilisateurVerifieTable } from '@tet/backend/users/authorizations/roles/utilisateur-verifie.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { EmailService } from '@tet/backend/utils/email/email.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { collectiviteTypeEnum } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  onTestFinished,
  vi,
} from 'vitest';
import { invitationTable } from '../invitation.table';

type Caller = ReturnType<TrpcRouter['createCaller']>;

const enTete = 'type;region_code;departement_code;siret;nom;email;role';
const csv = (...lignes: string[]) => [enTete, ...lignes].join('\n');

describe('Import des correspondants de service', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;
  let caller: Caller;
  let sendEmailSpy: ReturnType<typeof vi.spyOn>;
  let initiateurEmail: string;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    db = await getTestDatabase(app);
    caller = router.createCaller({ user: getServiceRoleUser() });

    const { user: initiateur } = await addTestUser(db, {
      role: CollectiviteRole.ADMIN,
    });
    initiateurEmail = initiateur.email;

    return async () => {
      await app.close();
    };
  });

  beforeEach(() => {
    // `spyOn` rend le mock déjà posé : sans ce reset, les appels d'un test
    // précédent compteraient dans le suivant.
    sendEmailSpy = vi.spyOn(app.get(EmailService), 'sendEmail');
    sendEmailSpy.mockReset();
    sendEmailSpy.mockResolvedValue({
      success: true,
      data: { messageId: 'test-message-id' },
    } as never);
  });

  /** Une DREAL neuve sur un code de région libre : l'index unique l'exige. */
  async function creerDreal() {
    const regionCode = await pickFreeRegionCode(db, collectiviteTypeEnum.DREAL);
    const { collectivite, cleanup } = await addTestCollectivite(db, {
      type: collectiviteTypeEnum.DREAL,
      regionCode,
      nom: `DREAL ${regionCode}`,
    });

    // `addTestCollectivite` ne nettoie ni les droits ni les invitations : une
    // DREAL laissée derrière rendrait son code de région inutilisable. Le
    // nettoyage passe par `onTestFinished` pour tenir même quand une assertion
    // casse avant la fin du test.
    onTestFinished(async () => {
        await db.db
          .delete(invitationTable)
          .where(eq(invitationTable.collectiviteId, collectivite.id));
        await db.db
          .delete(utilisateurCollectiviteAccessTable)
          .where(
            eq(
              utilisateurCollectiviteAccessTable.collectiviteId,
              collectivite.id
            )
          );
      await cleanup();
    });

    return { collectivite, regionCode };
  }

  const importer = (
    contenuCsv: string,
    options: { mode?: 'a-blanc' | 'envoi' } = {}
  ) =>
    caller.collectivites.membres.imports.correspondants({
      contenuCsv,
      initiateurEmail,
      ...options,
    });

  it("refuse un appelant qui n'a pas le rôle de service", async () => {
    const anonyme = router.createCaller({ user: null });
    await expect(
      anonyme.collectivites.membres.imports.correspondants({
        contenuCsv: csv('dreal;01;;;;correspondant@example.com;'),
        initiateurEmail,
      })
    ).rejects.toThrow();
  });

  it("refuse un initiateur qui n'a pas de compte", async () => {
    await expect(
      caller.collectivites.membres.imports.correspondants({
        contenuCsv: csv('dreal;01;;;;correspondant@example.com;'),
        initiateurEmail: 'personne@example.com',
      })
    ).rejects.toThrow(/initiateur/i);
  });

  describe('mode à blanc', () => {
    it("n'écrit rien et n'envoie rien, tout en annonçant ce qui partirait", async () => {
      const dreal = await creerDreal();
      const email = `correspondant.ablanc.${Date.now()}@example.com`;

      const rapport = await importer(
        csv(`dreal;${dreal.regionCode};;;;${email};`)
      );

      expect(rapport.mode).toBe('a-blanc');
      expect(rapport.envoisPrevus).toBe(1);
      expect(rapport.resultats[0]).toMatchObject({
        email,
        statut: 'invite',
        service: { collectiviteId: dreal.collectivite.id },
      });
      expect(sendEmailSpy).not.toHaveBeenCalled();

      const invitations = await db.db
        .select()
        .from(invitationTable)
        .where(eq(invitationTable.collectiviteId, dreal.collectivite.id));
      expect(invitations).toHaveLength(0);

    });
  });

  describe('mode envoi', () => {
    it('invite un correspondant sans compte', async () => {
      const dreal = await creerDreal();
      const email = `correspondant.invite.${Date.now()}@example.com`;

      const rapport = await importer(
        csv(`dreal;${dreal.regionCode};;;;${email};`),
        { mode: 'envoi' }
      );

      expect(rapport.resultats[0].statut).toBe('invite');
      expect(sendEmailSpy).toHaveBeenCalledOnce();

      const [invitation] = await db.db
        .select()
        .from(invitationTable)
        .where(eq(invitationTable.collectiviteId, dreal.collectivite.id));
      expect(invitation).toMatchObject({
        email,
        role: CollectiviteRole.ADMIN,
      });

      const html = (sendEmailSpy.mock.calls[0][0] as { html: string }).html;
      expect(html).toContain(`/invitation/${invitation.id}`);

    });

    it("rattache un correspondant qui a déjà un compte, sans créer d'invitation", async () => {
      const dreal = await creerDreal();
      const { user } = await addTestUser(db, { role: CollectiviteRole.LECTURE });

      const rapport = await importer(
        csv(`dreal;${dreal.regionCode};;;;${user.email};`),
        { mode: 'envoi' }
      );

      expect(rapport.resultats[0].statut).toBe('rattache');

      const [droit] = await db.db
        .select()
        .from(utilisateurCollectiviteAccessTable)
        .where(
          and(
            eq(
              utilisateurCollectiviteAccessTable.collectiviteId,
              dreal.collectivite.id
            ),
            eq(utilisateurCollectiviteAccessTable.userId, user.id)
          )
        );
      expect(droit).toMatchObject({
        isActive: true,
        role: CollectiviteRole.ADMIN,
      });

      const [verifie] = await db.db
        .select()
        .from(utilisateurVerifieTable)
        .where(eq(utilisateurVerifieTable.userId, user.id));
      expect(verifie.verifie).toBe(true);

      const invitations = await db.db
        .select()
        .from(invitationTable)
        .where(eq(invitationTable.collectiviteId, dreal.collectivite.id));
      expect(invitations).toHaveLength(0);

      // Un service déconcentré n'a pas de tableau de bord : sa racine est
      // l'espace d'instruction.
      const html = (sendEmailSpy.mock.calls[0][0] as { html: string }).html;
      expect(html).toContain(
        `/collectivite/${dreal.collectivite.id}/demandes-avis`
      );

    });

    it("ne renvoie rien au second passage du même fichier", async () => {
      const dreal = await creerDreal();
      const email = `correspondant.rejeu.${Date.now()}@example.com`;
      const fichier = csv(`dreal;${dreal.regionCode};;;;${email};`);

      await importer(fichier, { mode: 'envoi' });
      sendEmailSpy.mockClear();

      const second = await importer(fichier, { mode: 'envoi' });

      expect(second.resultats[0].statut).toBe('deja_invite');
      expect(second.envoisPrevus).toBe(0);
      expect(sendEmailSpy).not.toHaveBeenCalled();

      const invitations = await db.db
        .select()
        .from(invitationTable)
        .where(eq(invitationTable.collectiviteId, dreal.collectivite.id));
      expect(invitations).toHaveLength(1);
    });

    it("laisse tranquille un membre actif et une invitation déjà en attente", async () => {
      const dreal = await creerDreal();
      const { user } = await addTestUser(db, {
        collectiviteId: dreal.collectivite.id,
        role: CollectiviteRole.EDITION,
      });
      const invite = `correspondant.pending.${Date.now()}@example.com`;
      await db.db.insert(invitationTable).values({
        email: invite,
        collectiviteId: dreal.collectivite.id,
        role: CollectiviteRole.LECTURE,
        createdBy: user.id,
      });

      const rapport = await importer(
        csv(
          `dreal;${dreal.regionCode};;;;${user.email};`,
          `dreal;${dreal.regionCode};;;;${invite};`
        ),
        { mode: 'envoi' }
      );

      expect(rapport.resultats.map(({ statut }) => statut)).toEqual([
        'deja_membre',
        'deja_invite',
      ]);
      expect(sendEmailSpy).not.toHaveBeenCalled();
    });

    it("ne ressuscite pas une invitation révoquée", async () => {
      const dreal = await creerDreal();
      const { user } = await addTestUser(db, { role: CollectiviteRole.LECTURE });
      const revoque = `correspondant.revoque.${Date.now()}@example.com`;
      await db.db.insert(invitationTable).values({
        email: revoque,
        collectiviteId: dreal.collectivite.id,
        role: CollectiviteRole.LECTURE,
        createdBy: user.id,
        active: false,
      });

      const rapport = await importer(
        csv(`dreal;${dreal.regionCode};;;;${revoque};`),
        { mode: 'envoi' }
      );

      expect(rapport.resultats[0].statut).toBe('revoquee');
      expect(sendEmailSpy).not.toHaveBeenCalled();
    });

    it("reconnaît un compte existant malgré la casse de l'adresse", async () => {
      const dreal = await creerDreal();
      const { user } = await addTestUser(db, { role: CollectiviteRole.LECTURE });

      const rapport = await importer(
        csv(`dreal;${dreal.regionCode};;;;${user.email.toUpperCase()};`),
        { mode: 'envoi' }
      );

      expect(rapport.resultats[0].statut).toBe('rattache');
      expect(rapport.resultats[0].email).toBe(user.email);
    });

    it("signale un envoi refusé sans défaire le rattachement", async () => {
      const dreal = await creerDreal();
      const email = `correspondant.echec.${Date.now()}@example.com`;

      sendEmailSpy.mockResolvedValueOnce({
        success: false,
        error: {
          messageId: null,
          status: 'not-whitelisted',
          errorMessage: 'hors whitelist',
        },
      } as never);

      const rapport = await importer(
        csv(`dreal;${dreal.regionCode};;;;${email};`),
        { mode: 'envoi' }
      );

      expect(rapport.resultats[0]).toMatchObject({
        statut: 'echec_envoi',
        motif: 'not-whitelisted',
      });

      // L'invitation est bien posée : un administrateur peut la renvoyer depuis
      // la page des membres du service.
      const invitations = await db.db
        .select()
        .from(invitationTable)
        .where(eq(invitationTable.collectiviteId, dreal.collectivite.id));
      expect(invitations).toHaveLength(1);
      expect(invitations[0].pending).toBe(true);
    });
  });

  describe('doublons', () => {
    it("n'écrit qu'une fois quand le fichier répète le même couple", async () => {
      const dreal = await creerDreal();
      const email = `correspondant.doublon.${Date.now()}@example.com`;

      const rapport = await importer(
        csv(
          `dreal;${dreal.regionCode};;;;${email};`,
          `dreal;${dreal.regionCode};;;;${email};`
        ),
        { mode: 'envoi' }
      );

      expect(rapport.resultats.map(({ statut }) => statut)).toEqual([
        'invite',
        'erreur',
      ]);
      expect(rapport.resultats[1].motif).toContain('doublon');
      expect(sendEmailSpy).toHaveBeenCalledOnce();

      const invitations = await db.db
        .select()
        .from(invitationTable)
        .where(eq(invitationTable.collectiviteId, dreal.collectivite.id));
      expect(invitations).toHaveLength(1);
    });

  });

  describe('garde-fous', () => {
    it('signale la ligne fautive et traite quand même les autres', async () => {
      const dreal = await creerDreal();
      const valide = `correspondant.valide.${Date.now()}@example.com`;

      const rapport = await importer(
        csv(
          'dreal;ZZ;;;;service.introuvable@example.com;',
          'ddt;53;;;;deux.cles@example.com;',
          `dreal;${dreal.regionCode};;;;${valide};`
        ),
        { mode: 'envoi' }
      );

      expect(rapport.resultats[0]).toMatchObject({ ligne: 2, statut: 'erreur' });
      expect(rapport.resultats[1]).toMatchObject({ ligne: 3, statut: 'erreur' });
      expect(rapport.resultats[1].motif).toContain('departement_code');
      expect(rapport.resultats[2]).toMatchObject({ ligne: 4, statut: 'invite' });
      expect(sendEmailSpy).toHaveBeenCalledOnce();
    });
  });
});
