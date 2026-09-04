import { randomUUID } from 'node:crypto';
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
import { pcaetAvisTable } from '../shared/models/pcaet-avis.table';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';

describe('validerAvis', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: Awaited<ReturnType<typeof getTestRouter>>;
  let camille: AuthenticatedUser;
  let marie: AuthenticatedUser;
  let demarcheId: number;
  let demandeAvisId: number;
  let avisAvecPjId: string;
  let avisSansPjId: string;
  let premiereValidation: string | null;

  // Un code propre à cette spec, dans l'espace réservé aux codes figés — une
  // lettre puis un chiffre. Voir `pickFreeRegionCode` pour les trois espaces.
  const REGION = 'V1';

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    router = await getTestRouter(app);

    const deposante = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: { regionCode: REGION, nom: 'Agglo test valider avis' },
    });
    marie = getAuthUserFromUserCredentials(deposante.user);

    const dreal = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        type: 'dreal',
        regionCode: REGION,
        nom: 'DREAL test valider avis',
      },
    });
    camille = getAuthUserFromUserCredentials(dreal.user);

    const [demarche] = await db.db
      .insert(demarcheTable)
      .values({
        collectiviteId: deposante.collectivite.id,
        type: 'pcaet',
        titre: 'PCAET test valider avis',
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

    const [avisAvecPj] = await db.db
      .insert(pcaetAvisTable)
      .values({
        demandeAvisId,
        emetteurCollectiviteId: dreal.collectivite.id,
        auTitreDe: 'prefet_region',
        sens: 'favorable',
        fichierRef: 'avis-prefet.pdf',
        deposePar: camille.id,
      })
      .returning({ id: pcaetAvisTable.id });
    avisAvecPjId = avisAvecPj.id;

    const [avisSansPj] = await db.db
      .insert(pcaetAvisTable)
      .values({
        demandeAvisId,
        emetteurCollectiviteId: dreal.collectivite.id,
        auTitreDe: 'autorite_environnementale',
        sens: 'favorable',
        fichierRef: null,
        deposePar: camille.id,
      })
      .returning({ id: pcaetAvisTable.id });
    avisSansPjId = avisSansPj.id;

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

  const valider = (user: AuthenticatedUser, avisId: string) =>
    router.createCaller({ user }).demarches.pcaet.validerAvis({
      demandeAvisId,
      avisId,
    });

  it('valide un brouillon portant sa pièce jointe', async () => {
    const avis = await valider(camille, avisAvecPjId);

    const avisValide = avis.find((a) => a.id === avisAvecPjId);
    expect(avisValide?.valideLe).not.toBeNull();
    premiereValidation = avisValide?.valideLe ?? null;
  });

  it('revalider est sans effet et conserve la première validation', async () => {
    const avis = await valider(camille, avisAvecPjId);

    const avisValide = avis.find((a) => a.id === avisAvecPjId);
    expect(avisValide?.valideLe).toBe(premiereValidation);
  });

  it('refuse de valider un brouillon sans pièce jointe', async () => {
    await expect(valider(camille, avisSansPjId)).rejects.toThrow(
      'Un avis ne peut pas être validé sans pièce jointe'
    );
  });

  it('refuse un avis inconnu', async () => {
    await expect(valider(camille, randomUUID())).rejects.toThrow(
      "L'avis n'a pas été trouvé"
    );
  });

  it("refuse l'agente de la collectivité déposante", async () => {
    await expect(valider(marie, avisAvecPjId)).rejects.toThrow();
  });

  it("refuse quand la fenêtre d'avis est fermée", async () => {
    await db.db
      .update(demarcheTable)
      .set({
        avisDeadlineAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      })
      .where(eq(demarcheTable.id, demarcheId));

    await expect(valider(camille, avisAvecPjId)).rejects.toThrow();
  });
});
