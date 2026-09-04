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

  // Un code région propre à cette spec, pris hors de la plage réelle : les dix-huit
  // codes numériques portent les DREAL de l'import (collectivite/service_etat_import),
  // et l'index unique « une DREAL par région » ne tolère pas deux occupants.
  const REGION = 'AF';

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    router = await getTestRouter(app);

    const deposante = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: { regionCode: REGION, nom: 'Agglo test avis file' },
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
