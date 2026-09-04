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
import { onTestFinished } from 'vitest';
import { demarchePcaetDiagnosticSnapshotTable } from '../shared/models/demarche-pcaet-diagnostic-snapshot.table';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';

describe('getDiagnosticInstruction', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: Awaited<ReturnType<typeof getTestRouter>>;
  let camille: AuthenticatedUser;
  let marie: AuthenticatedUser;
  let demarcheId: number;
  let demandeAvisId: number;

  // Un code région propre à cette spec, pris hors de la plage réelle : les dix-huit
  // codes numériques portent les DREAL de l'import (collectivite/service_etat_import),
  // et l'index unique « une DREAL par région » ne tolère pas deux occupants.
  const REGION = 'DI';

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

  const poserPhoto = async () => {
    const [photo] = await db.db
      .insert(demarchePcaetDiagnosticSnapshotTable)
      .values({
        demarcheId,
        jalon: 'transmission',
        payload: {
          topics: [
            {
              code: 'profil_energie_climat',
              label: 'Profil énergie climat',
              icon: 'fire-line',
              kind: 'indicateurs',
              groupLabel: 'Secteur',
              rowLabel: null,
              unit: 'kteq CO2',
              referentielId: 'cae_1.a',
              referenceYear: 2018,
              horizons: [2030, 2036, 2050],
              extraYears: [],
              years: [2018, 2030, 2036, 2050],
              rows: [],
              valeurs: [],
            },
          ],
        },
      })
      .returning({ id: demarchePcaetDiagnosticSnapshotTable.id });

    onTestFinished(async () => {
      await db.db
        .delete(demarchePcaetDiagnosticSnapshotTable)
        .where(eq(demarchePcaetDiagnosticSnapshotTable.id, photo.id));
    });
  };

  it("l'instructrice lit la photo du diagnostic transmis", async () => {
    await poserPhoto();

    const diagnostic = await router
      .createCaller({ user: camille })
      .demarches.pcaet.getDiagnosticInstruction({ demandeAvisId });

    expect(diagnostic.snapshotDate).not.toBeNull();
    expect(diagnostic.topics.map((topic) => topic.code)).toContain(
      'profil_energie_climat'
    );
  });

  it('sert la photo même pendant une reprise d’élaboration', async () => {
    await poserPhoto();
    await db.db
      .update(demarcheTable)
      .set({ status: 'en_elaboration' })
      .where(eq(demarcheTable.id, demarcheId));

    onTestFinished(async () => {
      await db.db
        .update(demarcheTable)
        .set({ status: 'transmis_pour_avis' })
        .where(eq(demarcheTable.id, demarcheId));
    });

    const diagnostic = await router
      .createCaller({ user: camille })
      .demarches.pcaet.getDiagnosticInstruction({ demandeAvisId });

    expect(diagnostic.snapshotDate).not.toBeNull();
  });

  it("refuse un dépôt dont le diagnostic n'a pas été figé", async () => {
    await expect(
      router
        .createCaller({ user: camille })
        .demarches.pcaet.getDiagnosticInstruction({ demandeAvisId })
    ).rejects.toThrow("n'a pas été figé à la transmission");
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
