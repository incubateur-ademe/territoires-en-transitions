import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { seedTestDocument } from '@tet/backend/collectivites/documents/documents.test-fixture';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { PcaetAvisAuTitreDe } from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import { onTestFinished } from 'vitest';
import { pcaetAvisTable } from '../shared/models/pcaet-avis.table';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';

describe('upsertAvis', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: Awaited<ReturnType<typeof getTestRouter>>;
  let camille: AuthenticatedUser;
  let marie: AuthenticatedUser;
  let drealCollectiviteId: number;
  let demarcheId: number;
  let demandeAvisId: number;

  // Un code propre à cette spec, dans l'espace réservé aux codes figés — une
  // lettre puis un chiffre. Voir `pickFreeRegionCode` pour les trois espaces.
  const REGION = 'U1';

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    router = await getTestRouter(app);

    const deposante = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: { regionCode: REGION, nom: 'Agglo test upsert avis' },
    });
    marie = getAuthUserFromUserCredentials(deposante.user);

    const dreal = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        type: 'dreal',
        regionCode: REGION,
        nom: 'DREAL test upsert avis',
      },
    });
    camille = getAuthUserFromUserCredentials(dreal.user);
    drealCollectiviteId = dreal.collectivite.id;

    const [demarche] = await db.db
      .insert(demarcheTable)
      .values({
        collectiviteId: deposante.collectivite.id,
        type: 'pcaet',
        titre: 'PCAET test upsert avis',
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

  const upsert = (
    user: AuthenticatedUser,
    input: {
      auTitreDe: PcaetAvisAuTitreDe;
      fichierRef: string | null;
    }
  ) =>
    router.createCaller({ user }).demarches.pcaet.upsertAvis({
      demandeAvisId,
      ...input,
    });

  it('dépose un brouillon sans pièce jointe', async () => {
    const avis = await upsert(camille, {
      auTitreDe: 'prefet_region',
      fichierRef: null,
    });

    expect(avis).toHaveLength(1);
    expect(avis[0]).toMatchObject({
      demandeAvisId,
      auTitreDe: 'prefet_region',
      fichierRef: null,
      valideLe: null,
      deposePar: camille.id,
      modifieLe: null,
    });

    const [row] = await db.db
      .select({ emetteurCollectiviteId: pcaetAvisTable.emetteurCollectiviteId })
      .from(pcaetAvisTable)
      .where(eq(pcaetAvisTable.id, avis[0].id));
    expect(row.emetteurCollectiviteId).toBe(drealCollectiviteId);
  });

  it("modifie l'avis du même titre sans créer de doublon", async () => {
    const avis = await upsert(camille, {
      auTitreDe: 'prefet_region',
      fichierRef: 'avis-prefet.pdf',
    });

    expect(avis).toHaveLength(1);
    expect(avis[0].fichierRef).toBe('avis-prefet.pdf');
    expect(avis[0].deposePar).toBe(camille.id);
    expect(avis[0].modifieLe).not.toBeNull();
  });

  // Un avis validé est un acte rendu : le réécrire changerait sa pièce en lui
  // laissant sa date de validation, sans que la collectivité — qui l'a reçu —
  // en sache rien.
  it('refuse de modifier un avis validé', async () => {
    await db.db
      .update(pcaetAvisTable)
      .set({ valideLe: new Date().toISOString() })
      .where(
        and(
          eq(pcaetAvisTable.demandeAvisId, demandeAvisId),
          eq(pcaetAvisTable.auTitreDe, 'prefet_region')
        )
      );

    await expect(
      upsert(camille, {
        auTitreDe: 'prefet_region',
        fichierRef: 'avis-prefet-v2.pdf',
      })
    ).rejects.toThrow('Un avis validé ne peut plus être modifié');

    // Le refus vaut aussi, et surtout, pour le retrait de la pièce jointe.
    await expect(
      upsert(camille, {
        auTitreDe: 'prefet_region',
        fichierRef: null,
      })
    ).rejects.toThrow('Un avis validé ne peut plus être modifié');
  });

  /**
   * Les titres ne sont pas ouverts à tous : la DREAL répond du préfet de
   * région, le conseil régional de son président. Sans ce contrôle, l'une
   * signerait pour l'autre.
   */
  it("refuse un titre dont l'instructeur ne répond pas", async () => {
    await expect(
      upsert(camille, {
        auTitreDe: 'president_region',
        fichierRef: null,
      })
    ).rejects.toThrow("Cet instructeur ne rend pas d'avis à ce titre");
  });

  it("refuse l'agente de la collectivité déposante", async () => {
    await expect(
      upsert(marie, {
        auTitreDe: 'prefet_region',
        fichierRef: null,
      })
    ).rejects.toThrow();
  });

  it("refuse quand la fenêtre d'avis est fermée", async () => {
    await db.db
      .update(demarcheTable)
      .set({
        avisDeadlineAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      })
      .where(eq(demarcheTable.id, demarcheId));

    await expect(
      upsert(camille, {
        auTitreDe: 'prefet_region',
        fichierRef: 'avis-prefet-v3.pdf',
      })
    ).rejects.toThrow();
  });
});

/**
 * TETH-29. Le rapport d'un avis est versé dans la bibliothèque de son émetteur.
 * Pour une DREAL, l'accès restreint forcé sur les services déconcentrés suffit
 * à le fermer — mais le conseil régional dépose lui aussi un avis, au titre de
 * son président, et c'est une collectivité de plein exercice : sa bibliothèque
 * reste ouverte au mode visite. Sans marque de confidentialité, l'avis du
 * président de région serait donc lisible et téléchargeable par n'importe quel
 * compte vérifié de la plateforme, avant même sa validation.
 */
describe('la pièce jointe d’un avis est confidentielle', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: Awaited<ReturnType<typeof getTestRouter>>;

  const REGION = 'S4';

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    router = await getTestRouter(app);

    return async () => {
      await app.close();
    };
  });

  const deposerAvisDuPresidentDeRegion = async () => {
    const deposante = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: { regionCode: REGION, nom: 'Agglo test avis confidentiel' },
    });
    const conseilRegional = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        type: 'region',
        regionCode: REGION,
        nom: 'Conseil régional test avis confidentiel',
      },
    });
    const visiteur = await addTestUser(db);

    const [demarche] = await db.db
      .insert(demarcheTable)
      .values({
        collectiviteId: deposante.collectivite.id,
        type: 'pcaet',
        titre: 'PCAET test avis confidentiel',
        status: 'transmis_pour_avis',
        transmittedAt: new Date().toISOString(),
        avisDeadlineAt: new Date(
          Date.now() + 30 * 24 * 3600 * 1000
        ).toISOString(),
      })
      .returning({ id: demarcheTable.id });

    const [demande] = await db.db
      .insert(pcaetDemandeAvisTable)
      .values({
        demarcheId: demarche.id,
        instructeurCollectiviteId: conseilRegional.collectivite.id,
        source: 'seed',
      })
      .returning({ id: pcaetDemandeAvisTable.id });

    onTestFinished(async () => {
      await db.db
        .delete(pcaetDemandeAvisTable)
        .where(eq(pcaetDemandeAvisTable.id, demande.id));
      await db.db
        .delete(demarcheTable)
        .where(eq(demarcheTable.id, demarche.id));
      await visiteur.cleanup();
      await conseilRegional.cleanup();
      await deposante.cleanup();
    });

    // Le rapport est déjà dans la bibliothèque, sans marque : c'est ce que
    // rend la déduplication par empreinte quand le même fichier y a déjà été
    // déposé, et c'est donc l'état que le dépôt de l'avis doit corriger.
    const rapport = await seedTestDocument({
      databaseService: db,
      collectiviteId: conseilRegional.collectivite.id,
      filename: 'avis-president-region.pdf',
    });
    expect(rapport.confidentiel).toBe(false);

    const avis = await router
      .createCaller({
        user: getAuthUserFromUserCredentials(conseilRegional.user),
      })
      .demarches.pcaet.upsertAvis({
        demandeAvisId: demande.id,
        auTitreDe: 'president_region',
        fichierRef: rapport.hash,
      });

    return {
      conseilRegionalId: conseilRegional.collectivite.id,
      demandeAvisId: demande.id,
      avisId: avis[0].id,
      rapport,
      membre: getAuthUserFromUserCredentials(conseilRegional.user),
      visiteur: getAuthUserFromUserCredentials(visiteur.user),
    };
  };

  it('marque le rapport confidentiel dans la bibliothèque de l’émetteur', async () => {
    const { rapport } = await deposerAvisDuPresidentDeRegion();

    const [enBase] = await db.db
      .select({ confidentiel: bibliothequeFichierTable.confidentiel })
      .from(bibliothequeFichierTable)
      .where(eq(bibliothequeFichierTable.id, rapport.id));

    expect(enBase.confidentiel).toBe(true);
  });

  it('le soustrait à la bibliothèque vue par un compte vérifié sans droit', async () => {
    const { conseilRegionalId, rapport, visiteur } =
      await deposerAvisDuPresidentDeRegion();

    const { items } = await router
      .createCaller({ user: visiteur })
      .collectivites.documents.listBibliothequeDocuments({
        collectiviteId: conseilRegionalId,
        limit: 100,
      });

    expect(items.map(({ id }) => id)).not.toContain(rapport.id);

    await expect(() =>
      router
        .createCaller({ user: visiteur })
        .collectivites.documents.getDownloadUrl({
          collectiviteId: conseilRegionalId,
          fichierId: rapport.id,
        })
    ).rejects.toThrowError(/n'existe pas/i);
  });

  it('le laisse au membre du service qui l’a déposé', async () => {
    const { conseilRegionalId, rapport, membre } =
      await deposerAvisDuPresidentDeRegion();

    const { signedUrl } = await router
      .createCaller({ user: membre })
      .collectivites.documents.getDownloadUrl({
        collectiviteId: conseilRegionalId,
        fichierId: rapport.id,
      });

    expect(signedUrl).toContain(rapport.hash);
  });

  it('laisse télécharger par le circuit de l’avis une pièce devenue confidentielle', async () => {
    const {
      demandeAvisId: demande,
      avisId,
      rapport,
      membre,
    } = await deposerAvisDuPresidentDeRegion();

    const caller = router.createCaller({ user: membre });
    await caller.demarches.pcaet.validerAvis({
      demandeAvisId: demande,
      avisId,
    });

    // La confidentialité protège la bibliothèque, pas le circuit de l'avis :
    // `getAvisFileUrl` résout la pièce par son émetteur et signe l'URL sans
    // repasser par les droits documents de la collectivité.
    const { url } = await caller.demarches.pcaet.getAvisFileUrl({
      demandeAvisId: demande,
      avisId,
    });
    expect(url).toContain(rapport.hash);
  });
});
