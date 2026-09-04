import { INestApplication } from '@nestjs/common';
import {
  addTestCollectiviteAndUser,
  addTestCollectiviteAndUsers,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
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
import { eq, inArray } from 'drizzle-orm';
import { DepotPermissionsErrorEnum } from './depot-permissions.errors';
import { DepotPermissionsService } from './depot-permissions.service';
import { pcaetDemandeAvisTable } from './models/pcaet-demande-avis.table';

describe('DepotPermissionsService', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let service: DepotPermissionsService;
  let camille: AuthenticatedUser;
  let lea: AuthenticatedUser;
  let marie: AuthenticatedUser;
  let noe: AuthenticatedUser;
  let demarcheId: number;
  let demandeId: number;
  let demandeDrAdemeId: number;

  // Un code région propre à cette spec. L'index unique « une DREAL par région »
  // fait échouer toute spec qui partage le sien avec une autre, ou avec les
  // DREAL du seed (27 et 84) : chaque spec du domaine a donc le sien.
  // Un code propre à cette spec, dans l'espace réservé aux codes figés — une
  // lettre puis un chiffre. Voir `pickFreeRegionCode` pour les trois espaces.
  const REGION = 'P1';
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

    const dreal = await addTestCollectiviteAndUsers(db, {
      users: [
        { role: CollectiviteRole.ADMIN },
        { role: CollectiviteRole.LECTURE },
      ],
      collectivite: {
        type: 'dreal',
        regionCode: REGION,
        nom: 'DREAL test permissions',
      },
    });
    camille = getAuthUserFromUserCredentials(dreal.users[0]);
    lea = getAuthUserFromUserCredentials(dreal.users[1]);

    // Même région que la DREAL, mais en lecture. Noé y est admin.
    const drAdeme = await addTestCollectiviteAndUsers(db, {
      users: [{ role: CollectiviteRole.ADMIN }],
      collectivite: {
        type: 'dr_ademe',
        regionCode: REGION,
        nom: 'DR ADEME test permissions',
      },
    });
    noe = getAuthUserFromUserCredentials(drAdeme.users[0]);

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

    const [demandeDrAdeme] = await db.db
      .insert(pcaetDemandeAvisTable)
      .values({
        demarcheId,
        instructeurCollectiviteId: drAdeme.collectivite.id,
        source: 'seed',
      })
      .returning({ id: pcaetDemandeAvisTable.id });
    demandeDrAdemeId = demandeDrAdeme.id;

    return async () => {
      await db.db
        .delete(pcaetDemandeAvisTable)
        .where(
          inArray(pcaetDemandeAvisTable.id, [demandeId, demandeDrAdemeId])
        );
      await db.db.delete(demarcheTable).where(eq(demarcheTable.id, demarcheId));
      await drAdeme.cleanup();
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
    // Le contexte est rendu, et non jeté : l'appelant qui choisit un titre
    // d'avis y lit le type de l'instructeur pour vérifier qu'il en répond.
    expect(result.success).toBe(true);
    expect(result.success && result.data.instructeurType).toBe('dreal');
  });

  it('un membre en lecture seule consulte le dépôt', async () => {
    const result = await service.canConsulterDepot(demandeId, { user: lea });
    expect(result).toEqual(success(undefined));
  });

  it("mais ne dépose pas d'avis : instruire est une écriture", async () => {
    const result = await service.canDeposerAvis(demandeId, { user: lea });
    expect(result).toEqual(failure(DepotPermissionsErrorEnum.UNAUTHORIZED));
  });

  it('une admin de la DR ADEME consulte le dépôt', async () => {
    const result = await service.canConsulterDepot(demandeDrAdemeId, {
      user: noe,
    });
    expect(result).toEqual(success(undefined));
  });

  /** Admin de son service et pourtant aucun avis : c'est le type qui ferme. */
  it("mais n'y dépose aucun avis : la DR ADEME lit le dossier", async () => {
    const result = await service.canDeposerAvis(demandeDrAdemeId, {
      user: noe,
    });
    expect(result).toEqual(failure(DepotPermissionsErrorEnum.UNAUTHORIZED));
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

  it("instruction close : plus de dépôt d'avis, consultation toujours ouverte", async () => {
    await db.db
      .update(demarcheTable)
      .set({ status: 'instruit' })
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
