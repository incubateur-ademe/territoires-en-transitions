import { INestApplication } from '@nestjs/common';
import {
  addTestCollectivite,
  addTestCollectiviteAndUser,
  setCollectiviteCotStatus,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { seedTestDocument } from '@tet/backend/collectivites/documents/documents.test-fixture';
import { preuveLabellisationTable } from '@tet/backend/collectivites/documents/models/preuve-labellisation.table';
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
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import {
  EtoileAsString,
  ReferentielIdEnum,
  SujetDemande,
} from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { auditTable } from '../audit.table';
import { labellisationDemandeTable } from '../labellisation-demande.table';
import { labellisationTable } from '../labellisation.table';

describe('DossiersLabellisationRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;
  let programmeTete: AuthenticatedUser;
  let demandeur: { prenom: string; nom: string; email: string };

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    db = await getTestDatabase(app);

    const { user } = await addTestUser(db, { collectiviteId: null });
    await addUserRoleSupport({
      databaseService: db,
      userId: user.id,
      isSupport: false,
      hasRoleTeteAdmin: true,
    });
    programmeTete = getAuthUserFromUserCredentials(user);
    demandeur = { prenom: user.prenom, nom: user.nom, email: user.email };

    return async () => {
      await app.close();
    };
  });

  const caller = () => router.createCaller({ user: programmeTete });

  async function addDossier({
    collectiviteId,
    sujet = 'labellisation',
    etoiles = '2',
    envoyee = true,
    dateDebut = null,
    valide = false,
    associatedCollectiviteId = null,
  }: {
    collectiviteId: number;
    sujet?: SujetDemande;
    etoiles?: EtoileAsString | null;
    envoyee?: boolean;
    dateDebut?: string | null;
    valide?: boolean;
    associatedCollectiviteId?: number | null;
  }) {
    const [demande] = await db.db
      .insert(labellisationDemandeTable)
      .values({
        collectiviteId,
        referentiel: ReferentielIdEnum.CAE,
        enCours: !envoyee,
        sujet: envoyee ? sujet : null,
        etoiles: envoyee ? etoiles : null,
        associatedCollectiviteId,
        demandeur: programmeTete.id,
      })
      .returning();
    const [audit] = await db.db
      .insert(auditTable)
      .values({
        collectiviteId,
        referentielId: ReferentielIdEnum.CAE,
        demandeId: demande.id,
        dateDebut,
        valide,
        dateFin: valide ? new Date().toISOString() : null,
      })
      .returning();
    return audit;
  }

  const getLabellisations = (collectiviteId: number) =>
    db.db
      .select()
      .from(labellisationTable)
      .where(eq(labellisationTable.collectiviteId, collectiviteId));

  const getAudit = (auditId: number) =>
    db.db
      .select()
      .from(auditTable)
      .where(eq(auditTable.id, auditId))
      .then((rows) => rows[0]);

  test("refuse l'accès à un admin de collectivité sans rôle programme TETE", async () => {
    const { user } = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    const admin = router.createCaller({
      user: getAuthUserFromUserCredentials(user),
    });

    await expect(
      admin.referentiels.labellisations.admin.listDossiers({})
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  test("refuse les modifications d'un dossier à un admin de collectivité sans rôle programme TETE", async () => {
    const { collectivite, user } = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    const audit = await addDossier({ collectiviteId: collectivite.id });
    const admin = router.createCaller({
      user: getAuthUserFromUserCredentials(user),
    }).referentiels.labellisations.admin;
    const auditId = audit.id;

    const calls = [
      () => admin.updateDemande({ auditId, sujet: 'cot', etoiles: null }),
      () => admin.addAuditeur({ auditId, userId: user.id }),
      () => admin.removeAuditeur({ auditId, userId: user.id }),
      () => admin.closeDossier({ auditId, decision: 'clore' }),
      () =>
        admin.toggleCotActif({
          collectiviteId: collectivite.id,
          actif: false,
        }),
      () => admin.getActeEngagementDownloadUrl({ auditId, fichierId: 1 }),
    ];
    for (const call of calls) {
      await expect(call()).rejects.toMatchObject({ code: 'FORBIDDEN' });
    }
  });

  test("télécharge l'acte d'engagement d'un dossier sans être membre d'une collectivité en accès restreint", async () => {
    const { collectivite } = await addTestCollectivite(db, {
      accesRestreint: true,
    });
    const audit = await addDossier({
      collectiviteId: collectivite.id,
      etoiles: '1',
    });
    const acte = await seedTestDocument({
      databaseService: db,
      collectiviteId: collectivite.id,
      filename: 'acte-engagement.pdf',
      confidentiel: true,
    });
    const autreFichier = await seedTestDocument({
      databaseService: db,
      collectiviteId: collectivite.id,
      filename: 'autre.pdf',
    });
    await db.db.insert(preuveLabellisationTable).values({
      collectiviteId: collectivite.id,
      demandeId: audit.demandeId as number,
      fichierId: acte.id,
      objet: 'acte_engagement',
      modifiedBy: programmeTete.id,
    });
    const admin = caller().referentiels.labellisations.admin;

    // Le contrôle générique des documents reste fermé au programme TETE
    await expect(
      caller().collectivites.documents.getDownloadUrl({
        collectiviteId: collectivite.id,
        fichierId: acte.id,
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });

    expect(
      await admin.getActeEngagementDownloadUrl({
        auditId: audit.id,
        fichierId: acte.id,
      })
    ).toEqual({
      signedUrl: expect.stringContaining(acte.hash),
      filename: 'acte-engagement.pdf',
    });

    // Un fichier de la collectivité non rattaché au dossier reste inaccessible
    await expect(
      admin.getActeEngagementDownloadUrl({
        auditId: audit.id,
        fichierId: autreFichier.id,
      })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  test('liste les dossiers envoyés ou démarrés, sans les audits fantômes', async () => {
    const { collectivite } = await addTestCollectivite(db);
    const envoye = await addDossier({ collectiviteId: collectivite.id });

    const { collectivite: autre } = await addTestCollectivite(db);
    const fantome = await addDossier({
      collectiviteId: autre.id,
      envoyee: false,
    });

    const dossiers =
      await caller().referentiels.labellisations.admin.listDossiers({
        statuts: [],
      });
    const auditIds = dossiers.map((d) => d.auditId);

    expect(auditIds).toContain(envoye.id);
    expect(auditIds).not.toContain(fantome.id);
    expect(dossiers.find((d) => d.auditId === envoye.id)).toMatchObject({
      collectiviteNom: collectivite.nom,
      statut: 'demande_envoyee',
      sujet: 'labellisation',
      etoiles: '2',
      auditeurs: [],
      demandeur,
    });
  });

  test('filtre les dossiers par statut, sujet et référentiel', async () => {
    const { collectivite } = await addTestCollectivite(db);
    const premiereEtoile = await addDossier({
      collectiviteId: collectivite.id,
      etoiles: '1',
    });
    const { collectivite: autre } = await addTestCollectivite(db, {
      nom: `${collectivite.nom} bis`,
    });
    const cot = await addDossier({
      collectiviteId: autre.id,
      sujet: 'cot',
      etoiles: null,
    });
    await caller().referentiels.labellisations.admin.closeDossier({
      auditId: cot.id,
      decision: 'clore',
    });
    const admin = caller().referentiels.labellisations.admin;
    const auditIds = (input: Parameters<typeof admin.listDossiers>[0]) =>
      admin
        .listDossiers({ search: collectivite.nom, ...input })
        .then((dossiers) => dossiers.map((d) => d.auditId));

    // Par défaut, les dossiers en cours seulement
    expect(await auditIds({})).toEqual([premiereEtoile.id]);
    expect(await auditIds({ statuts: ['clos'] })).toEqual([cot.id]);
    expect(await auditIds({ statuts: [] })).toEqual([
      premiereEtoile.id,
      cot.id,
    ]);
    expect(await auditIds({ statuts: [], sujets: ['cot'] })).toEqual([cot.id]);
    expect(await auditIds({ statuts: [], referentielIds: ['eci'] })).toEqual(
      []
    );
    // La recherche porte aussi sur l'identifiant de la collectivité
    expect(
      await auditIds({ statuts: [], search: autre.id.toString() })
    ).toEqual([cot.id]);
    // Au-delà d'un int4, pas d'erreur Postgres : aucun résultat
    expect(await auditIds({ statuts: [], search: '99999999999' })).toEqual([]);
  });

  test('modifie la demande et refuse une étoile sur un audit COT seul', async () => {
    const { collectivite } = await addTestCollectivite(db);
    const audit = await addDossier({ collectiviteId: collectivite.id });
    const admin = caller().referentiels.labellisations.admin;

    await expect(
      admin.updateDemande({ auditId: audit.id, sujet: 'cot', etoiles: '2' })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

    await admin.updateDemande({
      auditId: audit.id,
      sujet: 'labellisation_cot',
      etoiles: '3',
    });

    const dossier = await admin.getDossier({ auditId: audit.id });
    expect(dossier).toMatchObject({ sujet: 'labellisation_cot', etoiles: '3' });
  });

  test('liste les auditeurs, refuse une personne sans le rôle auditeur et retire un auditeur', async () => {
    const { collectivite } = await addTestCollectivite(db);
    const audit = await addDossier({ collectiviteId: collectivite.id });
    const { user: auditeur } = await addTestUser(db, { collectiviteId: null });
    const { user: nonAuditeur } = await addTestUser(db, {
      collectiviteId: null,
    });
    await addUserRoleSupport({
      databaseService: db,
      userId: auditeur.id,
      isSupport: false,
      hasRoleTeteAuditeur: true,
    });
    const admin = caller().referentiels.labellisations.admin;

    const auditeurs = await admin.listAuditeurs();
    expect(auditeurs).toContainEqual(
      expect.objectContaining({ userId: auditeur.id })
    );
    expect(auditeurs).not.toContainEqual(
      expect.objectContaining({ userId: nonAuditeur.id })
    );

    await expect(
      admin.addAuditeur({ auditId: audit.id, userId: nonAuditeur.id })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

    const added = await admin.addAuditeur({
      auditId: audit.id,
      userId: auditeur.id,
    });
    expect(added.userId).toBe(auditeur.id);

    const dossier = await admin.getDossier({ auditId: audit.id });
    expect(dossier.auditeurs).toEqual([
      expect.objectContaining({ userId: auditeur.id, email: auditeur.email }),
    ]);

    await admin.removeAuditeur({ auditId: audit.id, userId: auditeur.id });
    const dossierSansAuditeur = await admin.getDossier({ auditId: audit.id });
    expect(dossierSansAuditeur.auditeurs).toEqual([]);
  });

  test('ajoute par email une personne sans le rôle auditeur et le lui attribue', async () => {
    const { collectivite } = await addTestCollectivite(db);
    const audit = await addDossier({ collectiviteId: collectivite.id });
    const { user: nouveau } = await addTestUser(db, { collectiviteId: null });
    const admin = caller().referentiels.labellisations.admin;

    await expect(
      admin.addAuditeur({ auditId: audit.id, email: 'inconnu@example.com' })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    // userId et email ensemble : entrée ambiguë, refusée
    await expect(
      admin.addAuditeur({
        auditId: audit.id,
        userId: nouveau.id,
        email: nouveau.email,
      } as never)
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

    const added = await admin.addAuditeur({
      auditId: audit.id,
      email: nouveau.email.toUpperCase(),
    });
    expect(added.userId).toBe(nouveau.id);

    const dossier = await admin.getDossier({ auditId: audit.id });
    expect(dossier.auditeurs).toEqual([
      expect.objectContaining({ userId: nouveau.id }),
    ]);
    expect(await admin.listAuditeurs()).toContainEqual(
      expect.objectContaining({ userId: nouveau.id })
    );
  });

  test('deux décisions simultanées sur un dossier : une seule est actée', async () => {
    const { collectivite } = await addTestCollectivite(db);
    const audit = await addDossier({
      collectiviteId: collectivite.id,
      etoiles: '2',
      dateDebut: '2026-01-15',
      valide: true,
    });
    const admin = caller().referentiels.labellisations.admin;

    const results = await Promise.allSettled([
      admin.closeDossier({
        auditId: audit.id,
        decision: 'labelliser',
        etoiles: 2,
        dateCra: '2026-06-10',
      }),
      admin.closeDossier({ auditId: audit.id, decision: 'clore' }),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);

    const [{ valideLabellisation }] = await db.db
      .select({ valideLabellisation: auditTable.valideLabellisation })
      .from(auditTable)
      .where(eq(auditTable.id, audit.id));
    const labellisations = await db.db
      .select({ id: labellisationTable.id })
      .from(labellisationTable)
      .where(eq(labellisationTable.auditId, audit.id));
    // Labellisé et validé, ou refusé sans labellisation : jamais un mélange
    expect(labellisations.length > 0).toBe(valideLabellisation === true);
  });

  test("labellise avec l'étoile et la date de CRA saisies, y compris la collectivité associée", async () => {
    const { collectivite } = await addTestCollectivite(db);
    const { collectivite: associee } = await addTestCollectivite(db);
    const audit = await addDossier({
      collectiviteId: collectivite.id,
      etoiles: '2',
      dateDebut: '2026-01-15',
      valide: true,
      associatedCollectiviteId: associee.id,
    });

    await caller().referentiels.labellisations.admin.closeDossier({
      auditId: audit.id,
      decision: 'labelliser',
      etoiles: 3,
      dateCra: '2026-06-10',
    });

    for (const collectiviteId of [collectivite.id, associee.id]) {
      expect(await getLabellisations(collectiviteId)).toEqual([
        expect.objectContaining({
          auditId: audit.id,
          etoiles: 3,
          obtenueLe: expect.stringContaining('2026-06-10'),
          // Pas de snapshot post-audit dans ce test
          scoreRealise: null,
        }),
      ]);
    }
    expect(await getAudit(audit.id)).toMatchObject({
      clos: true,
      valideLabellisation: true,
      dateCnl: expect.stringContaining('2026-06-10'),
    });
  });

  test("refuse de labelliser un audit non validé par l'auditeur", async () => {
    const { collectivite } = await addTestCollectivite(db);
    const audit = await addDossier({
      collectiviteId: collectivite.id,
      dateDebut: '2026-01-15',
    });

    await expect(
      caller().referentiels.labellisations.admin.closeDossier({
        auditId: audit.id,
        decision: 'labelliser',
        etoiles: 2,
        dateCra: '2026-06-10',
      })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  test('remonte une erreur et laisse le dossier ouvert si une labellisation existe déjà la même année', async () => {
    const { collectivite } = await addTestCollectivite(db);
    await db.db.insert(labellisationTable).values({
      collectiviteId: collectivite.id,
      referentiel: ReferentielIdEnum.CAE,
      etoiles: 1,
      obtenueLe: '2026-02-01',
    });
    const audit = await addDossier({
      collectiviteId: collectivite.id,
      dateDebut: '2026-01-15',
      valide: true,
    });

    await expect(
      caller().referentiels.labellisations.admin.closeDossier({
        auditId: audit.id,
        decision: 'labelliser',
        etoiles: 2,
        dateCra: '2026-06-10',
      })
    ).rejects.toMatchObject({ code: 'CONFLICT' });

    expect(await getAudit(audit.id)).toMatchObject({ clos: false });
  });

  test('valide une 1ère étoile sans score et clôt le dossier', async () => {
    const { collectivite } = await addTestCollectivite(db);
    const audit = await addDossier({
      collectiviteId: collectivite.id,
      etoiles: '1',
    });
    const admin = caller().referentiels.labellisations.admin;

    const [dossier] = await admin.listDossiers({ search: collectivite.nom });
    expect(dossier.statut).toBe('premiere_etoile_a_valider');

    await admin.closeDossier({
      auditId: audit.id,
      decision: 'valider_premiere_etoile',
      date: '2026-10-27',
    });

    expect(await getLabellisations(collectivite.id)).toEqual([
      expect.objectContaining({ etoiles: 1, scoreRealise: null }),
    ]);
    expect(await getAudit(audit.id)).toMatchObject({ clos: true });
  });

  test('refuse une 1ère étoile : le dossier est clos sans labellisation', async () => {
    const { collectivite } = await addTestCollectivite(db);
    const audit = await addDossier({
      collectiviteId: collectivite.id,
      etoiles: '1',
    });

    await caller().referentiels.labellisations.admin.closeDossier({
      auditId: audit.id,
      decision: 'clore',
    });

    expect(await getLabellisations(collectivite.id)).toEqual([]);
    expect(await getAudit(audit.id)).toMatchObject({
      clos: true,
      valideLabellisation: false,
    });
  });

  test("liste l'historique des audits de la collectivité sur la fiche dossier", async () => {
    const { collectivite } = await addTestCollectivite(db);
    const ancien = await addDossier({
      collectiviteId: collectivite.id,
      sujet: 'cot',
      etoiles: null,
      dateDebut: '2022-01-15',
      valide: true,
    });
    await caller().referentiels.labellisations.admin.closeDossier({
      auditId: ancien.id,
      decision: 'clore',
    });
    const courant = await addDossier({ collectiviteId: collectivite.id });

    const dossier = await caller().referentiels.labellisations.admin.getDossier(
      {
        auditId: courant.id,
      }
    );

    expect(dossier.historique).toEqual([
      expect.objectContaining({
        auditId: ancien.id,
        sujet: 'cot',
        statut: 'clos',
      }),
    ]);
  });

  test('liste les COT et désactive un COT', async () => {
    const { collectivite } = await addTestCollectivite(db);
    await setCollectiviteCotStatus(db, collectivite.id, 'active');
    const admin = caller().referentiels.labellisations.admin;

    expect(await admin.listCot({ search: collectivite.nom })).toEqual([
      {
        collectiviteId: collectivite.id,
        collectiviteNom: collectivite.nom,
        actif: true,
        signataireNom: collectivite.nom,
      },
    ]);

    await admin.toggleCotActif({
      collectiviteId: collectivite.id,
      actif: false,
    });

    const [cot] = await admin.listCot({ search: collectivite.nom });
    expect(cot.actif).toBe(false);
  });
});
