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
import { inArray } from 'drizzle-orm';
import { pcaetAvisTable } from '../shared/models/pcaet-avis.table';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';

describe('envoyerAvis', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: Awaited<ReturnType<typeof getTestRouter>>;
  let camille: AuthenticatedUser;
  let marie: AuthenticatedUser;
  let demarcheIds: number[];
  let demandeAvisId: number;
  let demandeSansReferentId: number;
  let avisValideId: string;
  let avisBrouillonId: string;
  let avisSansReferentId: string;

  const REGION = '28';

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    router = await getTestRouter(app);

    const deposante = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: { regionCode: REGION, nom: 'Agglo test envoyer avis' },
    });
    marie = getAuthUserFromUserCredentials(deposante.user);

    const deposanteSansReferent = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
      collectivite: {
        regionCode: REGION,
        nom: 'Agglo sans referent test envoyer avis',
      },
    });

    const dreal = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        type: 'dreal',
        regionCode: REGION,
        nom: 'DREAL test envoyer avis',
      },
    });
    camille = getAuthUserFromUserCredentials(dreal.user);

    const demarches = await db.db
      .insert(demarcheTable)
      .values(
        [deposante.collectivite.id, deposanteSansReferent.collectivite.id].map(
          (collectiviteId) => ({
            collectiviteId,
            type: 'pcaet' as const,
            titre: 'PCAET test envoyer avis',
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
    demandeSansReferentId = demandes[1].id;

    const avis = await db.db
      .insert(pcaetAvisTable)
      .values([
        {
          demandeAvisId,
          emetteurCollectiviteId: dreal.collectivite.id,
          auTitreDe: 'prefet_region' as const,
          sens: 'favorable' as const,
          fichierRef: 'avis-prefet.pdf',
          valideLe: new Date().toISOString(),
          deposePar: camille.id,
        },
        {
          demandeAvisId,
          emetteurCollectiviteId: dreal.collectivite.id,
          auTitreDe: 'autorite_environnementale' as const,
          sens: 'favorable' as const,
          fichierRef: 'avis-ae.pdf',
          deposePar: camille.id,
        },
        {
          demandeAvisId: demandeSansReferentId,
          emetteurCollectiviteId: dreal.collectivite.id,
          auTitreDe: 'prefet_region' as const,
          sens: 'favorable' as const,
          fichierRef: 'avis-prefet.pdf',
          valideLe: new Date().toISOString(),
          deposePar: camille.id,
        },
      ])
      .returning({
        id: pcaetAvisTable.id,
        demandeAvisId: pcaetAvisTable.demandeAvisId,
        auTitreDe: pcaetAvisTable.auTitreDe,
      });
    avisValideId = avis.find(
      (a) => a.demandeAvisId === demandeAvisId && a.auTitreDe === 'prefet_region'
    )!.id;
    avisBrouillonId = avis.find(
      (a) => a.auTitreDe === 'autorite_environnementale'
    )!.id;
    avisSansReferentId = avis.find(
      (a) => a.demandeAvisId === demandeSansReferentId
    )!.id;

    return async () => {
      await db.db
        .delete(pcaetDemandeAvisTable)
        .where(
          inArray(pcaetDemandeAvisTable.id, [
            demandeAvisId,
            demandeSansReferentId,
          ])
        );
      await db.db
        .delete(demarcheTable)
        .where(inArray(demarcheTable.id, demarcheIds));
      await dreal.cleanup();
      await deposanteSansReferent.cleanup();
      await deposante.cleanup();
      await app.close();
    };
  });

  const envoyer = (
    user: AuthenticatedUser,
    avisId: string,
    cibleDemandeAvisId?: number
  ) =>
    router.createCaller({ user }).demarches.pcaet.envoyerAvis({
      demandeAvisId: cibleDemandeAvisId ?? demandeAvisId,
      avisId,
      objet: "L'instruction du PCAET est terminée",
      message: 'Bonjour,\nLe rapport est disponible.\nCordialement,',
    });

  it("envoie l'email au référent et trace l'envoi", async () => {
    const avis = await envoyer(camille, avisValideId);

    const avisEnvoye = avis.find((a) => a.id === avisValideId);
    expect(avisEnvoye?.envoyeLe).not.toBeNull();
  });

  it('refuse un brouillon', async () => {
    await expect(envoyer(camille, avisBrouillonId)).rejects.toThrow(
      'Seul un avis validé peut être envoyé au référent'
    );
  });

  it("refuse quand la collectivité n'a pas de référent", async () => {
    await expect(
      envoyer(camille, avisSansReferentId, demandeSansReferentId)
    ).rejects.toThrow("La collectivité n'a pas de référent à prévenir");
  });

  it('refuse un avis inconnu', async () => {
    await expect(envoyer(camille, randomUUID())).rejects.toThrow(
      "L'avis n'a pas été trouvé"
    );
  });

  it("refuse l'agente de la collectivité déposante", async () => {
    await expect(envoyer(marie, avisValideId)).rejects.toThrow();
  });

  it("refuse quand la fenêtre d'avis est fermée", async () => {
    await db.db
      .update(demarcheTable)
      .set({
        avisDeadlineAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      })
      .where(inArray(demarcheTable.id, [demarcheIds[0]]));

    await expect(envoyer(camille, avisValideId)).rejects.toThrow();
  });
});
