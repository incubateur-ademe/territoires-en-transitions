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
import { eq, inArray } from 'drizzle-orm';
import { pcaetAvisTable } from '../shared/models/pcaet-avis.table';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';

describe('deleteAvis', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: Awaited<ReturnType<typeof getTestRouter>>;
  let camille: AuthenticatedUser;
  let marie: AuthenticatedUser;
  let demarcheIds: number[];
  let demandeAvisId: number;
  let autreDemandeAvisId: number;
  let brouillonId: string;
  let avisValideId: string;
  let avisAutreDemandeId: string;

  // Un code région propre à cette spec, dans un espace que personne d'autre
  // n'occupe : les codes réels sont deux chiffres (et tous pris par l'import des
  // services), `pickFreeRegionCode` tire deux lettres. Une lettre suivie d'un
  // chiffre ne peut donc collisionner ni avec l'un ni avec l'autre, là où
  // l'index unique « une DREAL par région » ne tolère pas deux occupants.
  const REGION = 'D1';

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    router = await getTestRouter(app);

    const deposante = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: { regionCode: REGION, nom: 'Agglo test delete avis' },
    });
    marie = getAuthUserFromUserCredentials(deposante.user);

    const autreDeposante = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: { regionCode: REGION, nom: 'Agglo bis test delete avis' },
    });

    const dreal = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        type: 'dreal',
        regionCode: REGION,
        nom: 'DREAL test delete avis',
      },
    });
    camille = getAuthUserFromUserCredentials(dreal.user);

    const demarches = await db.db
      .insert(demarcheTable)
      .values(
        [deposante.collectivite.id, autreDeposante.collectivite.id].map(
          (collectiviteId) => ({
            collectiviteId,
            type: 'pcaet' as const,
            titre: 'PCAET test delete avis',
            status: 'transmis_pour_avis' as const,
            transmittedAt: new Date().toISOString(),
            avisDeadlineAt: new Date(
              Date.now() + 30 * 24 * 3600 * 1000
            ).toISOString(),
          })
        )
      )
      .returning({ id: demarcheTable.id });
    demarcheIds = demarches.map((d) => d.id);

    const demandes = await db.db
      .insert(pcaetDemandeAvisTable)
      .values(
        demarcheIds.map((demarcheId) => ({
          demarcheId,
          instructeurCollectiviteId: dreal.collectivite.id,
          source: 'seed' as const,
        }))
      )
      .returning({ id: pcaetDemandeAvisTable.id });
    demandeAvisId = demandes[0].id;
    autreDemandeAvisId = demandes[1].id;

    const avis = await db.db
      .insert(pcaetAvisTable)
      .values([
        {
          demandeAvisId,
          emetteurCollectiviteId: dreal.collectivite.id,
          auTitreDe: 'prefet_region' as const,
          sens: 'favorable' as const,
          fichierRef: null,
          deposePar: camille.id,
        },
        {
          demandeAvisId,
          emetteurCollectiviteId: dreal.collectivite.id,
          auTitreDe: 'autorite_environnementale' as const,
          sens: 'favorable' as const,
          fichierRef: 'avis-ae.pdf',
          valideLe: new Date().toISOString(),
          deposePar: camille.id,
        },
        {
          demandeAvisId: autreDemandeAvisId,
          emetteurCollectiviteId: dreal.collectivite.id,
          auTitreDe: 'prefet_region' as const,
          sens: 'favorable' as const,
          fichierRef: null,
          deposePar: camille.id,
        },
      ])
      .returning({
        id: pcaetAvisTable.id,
        demandeAvisId: pcaetAvisTable.demandeAvisId,
        auTitreDe: pcaetAvisTable.auTitreDe,
      });
    const brouillon = avis.find(
      (a) => a.demandeAvisId === demandeAvisId && a.auTitreDe === 'prefet_region'
    );
    const avisValide = avis.find(
      (a) => a.auTitreDe === 'autorite_environnementale'
    );
    const avisAutreDemande = avis.find(
      (a) => a.demandeAvisId === autreDemandeAvisId
    );
    if (!brouillon || !avisValide || !avisAutreDemande) {
      throw new Error('Failed to seed avis for deleteAvis tests');
    }
    brouillonId = brouillon.id;
    avisValideId = avisValide.id;
    avisAutreDemandeId = avisAutreDemande.id;

    return async () => {
      await db.db
        .delete(pcaetDemandeAvisTable)
        .where(
          inArray(pcaetDemandeAvisTable.id, [
            demandeAvisId,
            autreDemandeAvisId,
          ])
        );
      await db.db
        .delete(demarcheTable)
        .where(inArray(demarcheTable.id, demarcheIds));
      await dreal.cleanup();
      await autreDeposante.cleanup();
      await deposante.cleanup();
      await app.close();
    };
  });

  const supprimer = (user: AuthenticatedUser, avisId: string) =>
    router.createCaller({ user }).demarches.pcaet.deleteAvis({
      demandeAvisId,
      avisId,
    });

  it('supprime un brouillon', async () => {
    const avis = await supprimer(camille, brouillonId);

    expect(avis.map((a) => a.id)).not.toContain(brouillonId);
    expect(avis.map((a) => a.id)).toContain(avisValideId);
  });

  it('refuse de supprimer un avis validé', async () => {
    await expect(supprimer(camille, avisValideId)).rejects.toThrow(
      'Un avis validé ne peut pas être supprimé'
    );
  });

  it("refuse un avis d'une autre demande", async () => {
    await expect(supprimer(camille, avisAutreDemandeId)).rejects.toThrow(
      "L'avis n'a pas été trouvé"
    );

    const [avisIntact] = await db.db
      .select({ id: pcaetAvisTable.id })
      .from(pcaetAvisTable)
      .where(eq(pcaetAvisTable.id, avisAutreDemandeId));
    expect(avisIntact).toBeDefined();
  });

  it("refuse l'agente de la collectivité déposante", async () => {
    await expect(supprimer(marie, avisValideId)).rejects.toThrow();
  });

  it("refuse quand la fenêtre d'avis est fermée", async () => {
    await db.db
      .update(demarcheTable)
      .set({
        avisDeadlineAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      })
      .where(eq(demarcheTable.id, demarcheIds[0]));

    await expect(supprimer(camille, avisValideId)).rejects.toThrow();
  });
});
