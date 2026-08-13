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
import { PcaetDemandeAvisEtatEnum } from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';

describe('getDossierInstruction', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: Awaited<ReturnType<typeof getTestRouter>>;
  let camille: AuthenticatedUser;
  let marie: AuthenticatedUser;
  let demarcheId: number;
  let demandeAvisId: number;

  const REGION = '32';

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    router = await getTestRouter(app);

    const deposante = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: { regionCode: REGION, nom: 'Agglo test consultation' },
    });
    marie = getAuthUserFromUserCredentials(deposante.user);

    const dreal = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        type: 'dreal',
        regionCode: REGION,
        nom: 'DREAL test consultation',
      },
    });
    camille = getAuthUserFromUserCredentials(dreal.user);

    const [demarche] = await db.db
      .insert(demarcheTable)
      .values({
        collectiviteId: deposante.collectivite.id,
        type: 'pcaet',
        titre: 'PCAET test consultation',
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

  it("l'instructeur lit l'en-tête du dossier de la collectivité", async () => {
    const dossier = await router
      .createCaller({ user: camille })
      .demarches.pcaet.getDossierInstruction({ demandeAvisId });

    expect(dossier.demarcheId).toBe(demarcheId);
    expect(dossier.titre).toBe('PCAET test consultation');
    expect(dossier.status).toBe('transmis_pour_avis');
    expect(dossier.collectivite.nom).toBe('Agglo test consultation');
    expect(dossier.avisDeadlineAt).not.toBeNull();
    expect(dossier.createdAt).not.toBeNull();
    expect(dossier.modifiedAt).not.toBeNull();
    expect(dossier.launchedAt).toBeNull();
    expect(dossier.pilotes).toEqual([]);
  });

  it("expose l'état de l'instruction, pas seulement le statut du dossier", async () => {
    const dossier = await router
      .createCaller({ user: camille })
      .demarches.pcaet.getDossierInstruction({ demandeAvisId });

    expect(dossier.status).toBe('transmis_pour_avis');
    expect(dossier.etat).toBe(PcaetDemandeAvisEtatEnum.A_TRAITER);
  });

  it('et le modèle documentaire servi par la base, dossier vide', async () => {
    const dossier = await router
      .createCaller({ user: camille })
      .demarches.pcaet.getDossierInstruction({ demandeAvisId });

    expect(dossier.documents.definitions.length).toBeGreaterThan(0);
    expect(dossier.documents.definitions.map((d) => d.id)).toContain(
      'pcaet_diagnostic'
    );
    expect(dossier.documents.documents).toEqual([]);
  });

  it("refuse l'agente de la collectivité déposante", async () => {
    await expect(
      router
        .createCaller({ user: marie })
        .demarches.pcaet.getDossierInstruction({ demandeAvisId })
    ).rejects.toThrow();
  });

  it('refuse une demande inconnue', async () => {
    await expect(
      router
        .createCaller({ user: camille })
        .demarches.pcaet.getDossierInstruction({ demandeAvisId: 999999999 })
    ).rejects.toThrow();
  });
});
