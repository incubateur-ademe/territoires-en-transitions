import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { addAndEnableUserSuperAdminMode } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { collectiviteTypeEnum } from '@tet/domain/collectivites';
import {
  DemarchePcaetStatusEnum,
  DemarcheTypeEnum,
} from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { onTestFinished } from 'vitest';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';
import { DemarchePcaetDemoService } from './demarche-pcaet-demo.service';

describe('Mode démo du dépôt PCAET', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    db = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  const freshDemarche = async ({
    type = collectiviteTypeEnum.TEST,
    superAdmin = true,
  }: {
    type?: (typeof collectiviteTypeEnum)[keyof typeof collectiviteTypeEnum];
    superAdmin?: boolean;
  } = {}) => {
    const fixture = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: { type },
    });
    const user = getAuthUserFromUserCredentials(fixture.user);
    const caller = router.createCaller({ user });
    if (superAdmin) {
      const { cleanup } = await addAndEnableUserSuperAdminMode({
        app,
        caller,
        userId: user.id,
      });
      onTestFinished(cleanup);
    }
    const collectiviteId = fixture.collectivite.id;
    const demarche = await caller.demarches.pcaet.create({ collectiviteId });
    return {
      caller,
      collectiviteId,
      demarcheId: demarche.id,
      ref: { collectiviteId, demarcheId: demarche.id },
      demarche,
    };
  };

  const completerElaboration = async ({
    caller,
    ref,
  }: Awaited<ReturnType<typeof freshDemarche>>) => {
    for (const etape of ['documents', 'diagnostic', 'plan'] as const) {
      await caller.demarches.pcaet.demo.completerEtape({ ...ref, etape });
    }
  };

  it('signale le mode démo sur une collectivité de test, pour un super admin', async () => {
    const { demarche } = await freshDemarche();
    expect(demarche.demo).toBe(true);
  });

  it('enchaîne tout le parcours avec les raccourcis, sans saisir de vrai service', async () => {
    const fixture = await freshDemarche();
    const { caller, ref } = fixture;

    await completerElaboration(fixture);
    const complete = await caller.demarches.pcaet.get(ref);
    expect(complete.transitions.transmettre_pour_avis.enabled).toBe(true);

    await caller.demarches.pcaet.transmettrePourAvis(ref);

    const services = await app.get(DemarchePcaetDemoService).listServicesDemo();
    const demandes = await db.db
      .select({ instructeur: pcaetDemandeAvisTable.instructeurCollectiviteId })
      .from(pcaetDemandeAvisTable)
      .where(eq(pcaetDemandeAvisTable.demarcheId, ref.demarcheId));
    expect(demandes.map((d) => d.instructeur).sort()).toEqual(
      services.map((s) => s.id).sort()
    );

    await caller.demarches.pcaet.demo.simulerAvis(ref);
    expect((await caller.demarches.pcaet.get(ref)).status).toBe('instruit');

    await caller.demarches.pcaet.demo.completerEtape({
      ...ref,
      etape: 'documentsAval',
    });
    await caller.demarches.pcaet.publier({
      ...ref,
      dateAdoption: new Date().toISOString().slice(0, 10),
    });
    expect((await caller.demarches.pcaet.get(ref)).status).toBe('publie');

    // Le super admin supprime même un PCAET publié, saisines comprises.
    await caller.demarches.pcaet.delete(ref);
    const restantes = await db.db
      .select()
      .from(demarcheTable)
      .where(eq(demarcheTable.id, ref.demarcheId));
    expect(restantes).toHaveLength(0);
  });

  it('un second remplissage réutilise les fichiers de la bibliothèque', async () => {
    const first = await freshDemarche();
    await first.caller.demarches.pcaet.demo.completerEtape({
      ...first.ref,
      etape: 'documents',
    });
    const avant = await first.caller.demarches.pcaet.documents.list(first.ref);
    await first.caller.demarches.pcaet.delete(first.ref);

    const second = await first.caller.demarches.pcaet.create({
      collectiviteId: first.collectiviteId,
    });
    const ref = { collectiviteId: first.collectiviteId, demarcheId: second.id };
    await first.caller.demarches.pcaet.demo.completerEtape({
      ...ref,
      etape: 'documents',
    });
    const apres = await first.caller.demarches.pcaet.documents.list(ref);

    const fichierIds = (snapshot: typeof avant) =>
      snapshot.documents
        .map((document) => document.fichier?.id)
        .filter((id) => id !== undefined)
        .sort();
    expect(fichierIds(apres)).toEqual(fichierIds(avant));
  });

  it('réutilise le plan de démo d’une démonstration précédente', async () => {
    const first = await freshDemarche();
    await first.caller.demarches.pcaet.demo.completerEtape({
      ...first.ref,
      etape: 'plan',
    });
    const [planDemo] = (await first.caller.demarches.pcaet.get(first.ref))
      .planActionIds;
    await first.caller.demarches.pcaet.delete(first.ref);

    const second = await first.caller.demarches.pcaet.create({
      collectiviteId: first.collectiviteId,
    });
    const ref = { collectiviteId: first.collectiviteId, demarcheId: second.id };
    await first.caller.demarches.pcaet.demo.completerEtape({
      ...ref,
      etape: 'plan',
    });

    expect((await first.caller.demarches.pcaet.get(ref)).planActionIds).toEqual(
      [planDemo]
    );
  });

  it('crée un autre plan de démo quand une démarche en cours tient le premier', async () => {
    const first = await freshDemarche();
    await first.caller.demarches.pcaet.demo.completerEtape({
      ...first.ref,
      etape: 'plan',
    });
    const [planDemo] = (await first.caller.demarches.pcaet.get(first.ref))
      .planActionIds;
    // Deux démarches en cours à la fois (dépôts d'une supra, démarche hors
    // plateforme…) : la création le refuse, la base le permet, `instruit`
    // n'étant pas dans l'index d'unicité. Le plan reste tenu par la première.
    await db.db
      .update(demarcheTable)
      .set({ status: DemarchePcaetStatusEnum.INSTRUIT })
      .where(eq(demarcheTable.id, first.ref.demarcheId));
    const [second] = await db.db
      .insert(demarcheTable)
      .values({
        collectiviteId: first.collectiviteId,
        type: DemarcheTypeEnum.PCAET,
        titre: 'PCAET',
        status: DemarchePcaetStatusEnum.EN_ELABORATION,
      })
      .returning({ id: demarcheTable.id });
    const ref = { collectiviteId: first.collectiviteId, demarcheId: second.id };
    await first.caller.demarches.pcaet.demo.completerEtape({
      ...ref,
      etape: 'plan',
    });

    const planActionIds = (await first.caller.demarches.pcaet.get(ref))
      .planActionIds;
    expect(planActionIds).toHaveLength(1);
    expect(planActionIds).not.toContain(planDemo);
  });

  it('« réputé favorable » passe en finalisation sans avis', async () => {
    const fixture = await freshDemarche();
    await completerElaboration(fixture);
    await fixture.caller.demarches.pcaet.transmettrePourAvis(fixture.ref);

    await fixture.caller.demarches.pcaet.demo.reputerFavorable(fixture.ref);

    expect((await fixture.caller.demarches.pcaet.get(fixture.ref)).status).toBe(
      'instruit'
    );
  });

  it('refuse les raccourcis hors collectivité de test', async () => {
    const { caller, ref, demarche } = await freshDemarche({
      type: collectiviteTypeEnum.EPCI,
    });
    expect(demarche.demo).toBe(false);
    await expect(
      caller.demarches.pcaet.demo.completerEtape({ ...ref, etape: 'documents' })
    ).rejects.toThrow(/mode démo/);
  });

  it('refuse les raccourcis sans le mode super admin', async () => {
    const { caller, ref, demarche } = await freshDemarche({
      superAdmin: false,
    });
    expect(demarche.demo).toBe(false);
    await expect(
      caller.demarches.pcaet.demo.completerEtape({
        ...ref,
        etape: 'diagnostic',
      })
    ).rejects.toThrow(/mode démo/);
  });

  it('les raccourcis d’instruction exigent un dossier transmis', async () => {
    const { caller, ref } = await freshDemarche();
    await expect(caller.demarches.pcaet.demo.simulerAvis(ref)).rejects.toThrow(
      /pas possible à cette étape/
    );
  });
});
