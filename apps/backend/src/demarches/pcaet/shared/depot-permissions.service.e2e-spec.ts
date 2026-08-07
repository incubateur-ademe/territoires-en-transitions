import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { DepotPermissionsErrorEnum } from './depot-permissions.errors';
import { DepotPermissionsService } from './depot-permissions.service';
import { pcaetDemandeAvisTable } from './models/pcaet-demande-avis.table';

describe('DepotPermissionsService', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let service: DepotPermissionsService;
  let camille: AuthenticatedUser;
  let marie: AuthenticatedUser;
  let demarcheId: number;
  let demandeId: number;

  const REGION = '76';
  const dansUnMois = () =>
    new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  const hier = () => new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    service = app.get(DepotPermissionsService);

    const deposante = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: { regionCode: REGION },
    });
    marie = getAuthUserFromUserCredentials(deposante.user);

    const dreal = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        type: 'dreal',
        regionCode: REGION,
        nom: 'DREAL test permissions',
      },
    });
    camille = getAuthUserFromUserCredentials(dreal.user);

    const [demarche] = await db.db
      .insert(demarcheTable)
      .values({
        collectiviteId: deposante.collectivite.id,
        type: 'pcaet',
        titre: 'Démarche test permissions',
        status: 'transmis_pour_avis',
        transmittedAt: new Date().toISOString(),
        avisDeadlineAt: dansUnMois(),
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
    demandeId = demande.id;

    return async () => {
      await db.db
        .delete(pcaetDemandeAvisTable)
        .where(eq(pcaetDemandeAvisTable.id, demandeId));
      await db.db.delete(demarcheTable).where(eq(demarcheTable.id, demarcheId));
      await dreal.cleanup();
      await deposante.cleanup();
      await app.close();
    };
  });

  it('un membre actif de la DREAL consulte le dépôt', async () => {
    const result = await service.canConsulterDepot(demandeId, {
      user: camille,
    });
    expect(result).toEqual(success(undefined));
  });

  it('et dépose un avis tant que la fenêtre est ouverte', async () => {
    const result = await service.canDeposerAvis(demandeId, { user: camille });
    expect(result).toEqual(success(undefined));
  });

  it("l'agente de la collectivité déposante n'a aucun droit côté instruction", async () => {
    const result = await service.canConsulterDepot(demandeId, { user: marie });
    expect(result).toEqual(failure(DepotPermissionsErrorEnum.UNAUTHORIZED));
  });

  it('une demande inconnue est introuvable', async () => {
    const result = await service.canConsulterDepot(999999999, {
      user: camille,
    });
    expect(result).toEqual(
      failure(DepotPermissionsErrorEnum.DEMANDE_AVIS_NOT_FOUND)
    );
  });

  it("démarche adoptée : plus de dépôt d'avis, consultation toujours ouverte", async () => {
    await db.db
      .update(demarcheTable)
      .set({ status: 'adopte' })
      .where(eq(demarcheTable.id, demarcheId));

    expect(await service.canDeposerAvis(demandeId, { user: camille })).toEqual(
      failure(DepotPermissionsErrorEnum.UNAUTHORIZED)
    );
    expect(
      await service.canConsulterDepot(demandeId, { user: camille })
    ).toEqual(success(undefined));
  });

  it('échéance atteinte : le dépôt d’avis est verrouillé', async () => {
    await db.db
      .update(demarcheTable)
      .set({ status: 'transmis_pour_avis', avisDeadlineAt: hier() })
      .where(eq(demarcheTable.id, demarcheId));

    expect(await service.canDeposerAvis(demandeId, { user: camille })).toEqual(
      failure(DepotPermissionsErrorEnum.UNAUTHORIZED)
    );
  });
});
