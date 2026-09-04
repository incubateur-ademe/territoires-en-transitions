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
import { randomUUID } from 'node:crypto';
import { onTestFinished } from 'vitest';
import { pcaetAvisTable } from '../shared/models/pcaet-avis.table';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';

/**
 * Le chemin nominal — l'URL signée — n'est pas couvert ici : il demande un objet
 * réellement présent dans le stockage, comme pour `getDossierDocumentUrl`. Ne
 * sont vérifiés que les refus, qui sont la logique propre de ce use-case.
 */
describe('getAvisFileUrl', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: Awaited<ReturnType<typeof getTestRouter>>;
  let camille: AuthenticatedUser;
  let marie: AuthenticatedUser;
  let demandeAvisId: number;
  let avisSansPieceId: string;
  let instructeurCollectiviteId: number;
  let demarcheId: number;

  // Un code propre à cette spec, dans l'espace réservé aux codes figés — une
  // lettre puis un chiffre. Voir `pickFreeRegionCode` pour les trois espaces.
  const REGION = 'A1';
  const DEPARTEMENT = 'A10';

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    router = await getTestRouter(app);

    const deposante = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      // Le département sert au cas de la DDT ci-dessous, dont le périmètre se
      // lit sur le département et non sur la région.
      collectivite: {
        regionCode: REGION,
        departementCode: DEPARTEMENT,
        nom: 'Agglo test avis file',
      },
    });
    marie = getAuthUserFromUserCredentials(deposante.user);

    const dreal = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        type: 'dreal',
        regionCode: REGION,
        nom: 'DREAL test avis file',
      },
    });
    camille = getAuthUserFromUserCredentials(dreal.user);
    instructeurCollectiviteId = dreal.collectivite.id;

    const [demarche] = await db.db
      .insert(demarcheTable)
      .values({
        collectiviteId: deposante.collectivite.id,
        type: 'pcaet',
        titre: 'PCAET test avis file',
        status: 'transmis_pour_avis',
        avisDeadlineAt: new Date(
          Date.now() + 30 * 24 * 3600 * 1000
        ).toISOString(),
      })
      .returning({ id: demarcheTable.id });
    demarcheId = demarche.id;

    const [demande] = await db.db
      .insert(pcaetDemandeAvisTable)
      .values({
        demarcheId: demarche.id,
        instructeurCollectiviteId,
        source: 'seed',
      })
      .returning({ id: pcaetDemandeAvisTable.id });
    demandeAvisId = demande.id;

    // Brouillon : déposé sans rapport joint, ce que la table autorise tant que
    // l'avis n'est pas validé.
    const [avis] = await db.db
      .insert(pcaetAvisTable)
      .values({
        demandeAvisId,
        emetteurCollectiviteId: instructeurCollectiviteId,
        auTitreDe: 'prefet_region',
        sens: 'favorable',
        fichierRef: null,
      })
      .returning({ id: pcaetAvisTable.id });
    avisSansPieceId = avis.id;

    return async () => {
      await db.db
        .delete(pcaetAvisTable)
        .where(eq(pcaetAvisTable.demandeAvisId, demandeAvisId));
      await db.db
        .delete(pcaetDemandeAvisTable)
        .where(eq(pcaetDemandeAvisTable.id, demandeAvisId));
      await db.db
        .delete(demarcheTable)
        .where(eq(demarcheTable.id, demarche.id));
      await dreal.cleanup();
      await deposante.cleanup();
      await app.close();
    };
  });

  it('refuse un avis sans rapport joint', async () => {
    await expect(
      router.createCaller({ user: camille }).demarches.pcaet.getAvisFileUrl({
        demandeAvisId,
        avisId: avisSansPieceId,
      })
    ).rejects.toThrow("Cet avis n'a pas de rapport joint");
  });

  it('refuse un avis inconnu sur cette demande', async () => {
    await expect(
      router.createCaller({ user: camille }).demarches.pcaet.getAvisFileUrl({
        demandeAvisId,
        avisId: randomUUID(),
      })
    ).rejects.toThrow("L'avis n'a pas été trouvé");
  });

  /**
   * Un destinataire en lecture suit l'instruction : il télécharge le rapport
   * qu'un autre a rendu, parce que son droit vient d'avoir été saisi sur ce
   * dossier — pas d'avoir été saisi sur cette demande-là.
   *
   * Le rapport n'existe pas en bibliothèque : la barrière franchie, le service
   * échoue plus loin sur la pièce absente. C'est ce déplacement de l'erreur qui
   * distingue « autorisé » de « refusé », sans monter un fichier de test.
   */
  it('laisse un destinataire en lecture télécharger un avis validé', async () => {
    const ddt = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        type: 'ddt',
        regionCode: REGION,
        departementCode: DEPARTEMENT,
        nom: 'DDT test avis file',
      },
    });
    const [demandeDdt] = await db.db
      .insert(pcaetDemandeAvisTable)
      .values({
        demarcheId,
        instructeurCollectiviteId: ddt.collectivite.id,
        source: 'seed',
      })
      .returning({ id: pcaetDemandeAvisTable.id });

    // Validé, donc avec un rapport : la table refuse une validation sans pièce.
    const [valide] = await db.db
      .insert(pcaetAvisTable)
      .values({
        demandeAvisId,
        emetteurCollectiviteId: instructeurCollectiviteId,
        auTitreDe: 'autorite_environnementale',
        sens: 'favorable',
        fichierRef: 'rapport-inexistant.pdf',
        valideLe: new Date().toISOString(),
      })
      .returning({ id: pcaetAvisTable.id });

    onTestFinished(async () => {
      await db.db
        .delete(pcaetAvisTable)
        .where(eq(pcaetAvisTable.id, valide.id));
      await db.db
        .delete(pcaetDemandeAvisTable)
        .where(eq(pcaetDemandeAvisTable.id, demandeDdt.id));
      await ddt.cleanup();
    });

    const caller = router.createCaller({
      user: getAuthUserFromUserCredentials(ddt.user),
    });

    await expect(
      caller.demarches.pcaet.getAvisFileUrl({
        demandeAvisId,
        avisId: valide.id,
      })
    ).rejects.toThrow("Cet avis n'a pas de rapport joint");

    // Le brouillon de la DREAL, lui, ne sort pas de son espace.
    await expect(
      caller.demarches.pcaet.getAvisFileUrl({
        demandeAvisId,
        avisId: avisSansPieceId,
      })
    ).rejects.toThrow(/permission/i);
  });

  // La déposante n'instruit pas son propre dossier : elle n'a rien à lire ici.
  // Son accès aux avis rendus est un autre chemin, qui n'existe pas encore.
  it("refuse l'agente de la collectivité déposante", async () => {
    await expect(
      router.createCaller({ user: marie }).demarches.pcaet.getAvisFileUrl({
        demandeAvisId,
        avisId: avisSansPieceId,
      })
    ).rejects.toThrow();
  });
});
