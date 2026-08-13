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

describe('validerPartieInstruction', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: Awaited<ReturnType<typeof getTestRouter>>;
  let camille: AuthenticatedUser;
  let marie: AuthenticatedUser;
  let demarcheId: number;
  let demandeAvisId: number;

  const REGION = '53';

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    router = await getTestRouter(app);

    const deposante = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: { regionCode: REGION, nom: 'Agglo test validation' },
    });
    marie = getAuthUserFromUserCredentials(deposante.user);

    const dreal = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        type: 'dreal',
        regionCode: REGION,
        nom: 'DREAL test validation',
      },
    });
    camille = getAuthUserFromUserCredentials(dreal.user);

    const [demarche] = await db.db
      .insert(demarcheTable)
      .values({
        collectiviteId: deposante.collectivite.id,
        type: 'pcaet',
        titre: 'PCAET test validation',
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

  const valider = (
    user: AuthenticatedUser,
    partie: 'documents' | 'diagnostic' | 'plan',
    validee: boolean
  ) =>
    router.createCaller({ user }).demarches.pcaet.validerPartieInstruction({
      demandeAvisId,
      partie,
      validee,
    });

  it('valide une partie et la retrouve dans le dossier', async () => {
    const validations = await valider(camille, 'documents', true);

    expect(validations.map((v) => v.partie)).toEqual(['documents']);
    expect(validations[0].validePar).toBe(camille.id);

    const dossier = await router
      .createCaller({ user: camille })
      .demarches.pcaet.getDossierInstruction({ demandeAvisId });
    expect(dossier.partiesValidees.map((v) => v.partie)).toEqual(['documents']);
  });

  it('revalider la même partie ne crée pas de doublon et garde le premier auteur', async () => {
    const validations = await valider(camille, 'documents', true);

    expect(validations).toHaveLength(1);
    expect(validations[0].validePar).toBe(camille.id);
  });

  it('dévalide en supprimant la ligne', async () => {
    await valider(camille, 'diagnostic', true);
    const validations = await valider(camille, 'diagnostic', false);

    expect(validations.map((v) => v.partie)).toEqual(['documents']);
  });

  it("refuse l'agente de la collectivité déposante", async () => {
    await expect(valider(marie, 'plan', true)).rejects.toThrow();
  });

  it("refuse quand la fenêtre d'avis est fermée", async () => {
    await db.db
      .update(demarcheTable)
      .set({
        avisDeadlineAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      })
      .where(eq(demarcheTable.id, demarcheId));

    await expect(valider(camille, 'plan', true)).rejects.toThrow();
  });
});
