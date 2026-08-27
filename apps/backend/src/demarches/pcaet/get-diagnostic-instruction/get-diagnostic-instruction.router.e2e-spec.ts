import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';

describe('getDiagnosticInstruction', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: Awaited<ReturnType<typeof getTestRouter>>;
  let camille: AuthenticatedUser;
  let marie: AuthenticatedUser;
  let demarcheId: number;
  let demandeAvisId: number;

  const REGION = '52';

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    router = await getTestRouter(app);

    const deposante = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: { regionCode: REGION, nom: 'Agglo test diagnostic' },
    });
    marie = getAuthUserFromUserCredentials(deposante.user);

    const dreal = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        type: 'dreal',
        regionCode: REGION,
        nom: 'DREAL test diagnostic',
      },
    });
    camille = getAuthUserFromUserCredentials(dreal.user);

    const [demarche] = await db.db
      .insert(demarcheTable)
      .values({
        collectiviteId: deposante.collectivite.id,
        type: 'pcaet',
        titre: 'PCAET test diagnostic',
        status: 'transmis_pour_avis',
        transmittedAt: new Date().toISOString(),
        avisDeadlineAt: new Date(
          Date.now() + 30 * 24 * 3600 * 1000
        ).toISOString(),
      })
      .returning({ id: demarcheTable.id });
    demarcheId = demarche.id;

    const [demande] = await db.db
      .insert(pcaetDemandeAvisTable)
      .values({
        demarcheId,
        instructeurCollectiviteId: dreal.collectivite.id,
        source: 'seed',
      })
      .returning({ id: pcaetDemandeAvisTable.id });
    demandeAvisId = demande.id;

    return async () => {
      await db.db
        .delete(pcaetDemandeAvisTable)
        .where(eq(pcaetDemandeAvisTable.id, demandeAvisId));
      await db.db.delete(demarcheTable).where(eq(demarcheTable.id, demarcheId));
      await dreal.cleanup();
      await deposante.cleanup();
      await app.close();
    };
  });

  it("l'instructrice lit le diagnostic live du dépôt", async () => {
    const diagnostic = await router
      .createCaller({ user: camille })
      .demarches.pcaet.getDiagnosticInstruction({ demandeAvisId });

    expect(diagnostic.topics.map((topic) => topic.code)).toEqual([
      'profil_energie_climat',
      'polluants_atmospheriques',
      'sequestration',
      'consommation_energetique',
      'enr',
      'vulnerabilite_territoire',
    ]);
  });

  it('sert le diagnostic live même pendant une reprise d’élaboration', async () => {
    await db.db
      .update(demarcheTable)
      .set({ status: 'en_elaboration' })
      .where(eq(demarcheTable.id, demarcheId));

    const diagnostic = await router
      .createCaller({ user: camille })
      .demarches.pcaet.getDiagnosticInstruction({ demandeAvisId });

    expect(diagnostic.topics.length).toBe(6);

    await db.db
      .update(demarcheTable)
      .set({ status: 'transmis_pour_avis' })
      .where(eq(demarcheTable.id, demarcheId));
  });

  it("refuse l'agente de la collectivité déposante", async () => {
    await expect(
      router
        .createCaller({ user: marie })
        .demarches.pcaet.getDiagnosticInstruction({ demandeAvisId })
    ).rejects.toThrow();
  });

  it('refuse une demande inconnue', async () => {
    await expect(
      router
        .createCaller({ user: camille })
        .demarches.pcaet.getDiagnosticInstruction({ demandeAvisId: 999999999 })
    ).rejects.toThrow();
  });
});
