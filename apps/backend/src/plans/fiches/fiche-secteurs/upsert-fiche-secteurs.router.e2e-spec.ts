import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getDisposableTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { WebhookService } from '@tet/backend/utils/webhooks/webhook.service';
import { PCAET_PLAN_TYPE_KEY } from '@tet/domain/demarches';
import { SecteurReglementaire } from '@tet/domain/plans';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import { onTestFinished, vi } from 'vitest';
import { createFiche } from '../fiches.test-fixture';
import { axeTable } from '../shared/models/axe.table';
import { ficheActionAxeTable } from '../shared/models/fiche-action-axe.table';
import { ficheActionTable } from '../shared/models/fiche-action.table';
import { planActionTypeTable } from '../shared/models/plan-action-type.table';
import { CommunsSecteursApiService } from './communs-secteurs-api.service';
import { FakeCommunsSecteursApiService } from './communs-secteurs-api.test-fixture';
import { ficheActionSecteurAttributionTable } from './fiche-action-secteur-attribution.table';

describe('Modification des secteurs d’une fiche', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;
  const communs = new FakeCommunsSecteursApiService();

  let editeur: AuthenticatedUser;
  let lecteur: AuthenticatedUser;
  let collectiviteId: number;
  let pcaetTypeId: number;

  beforeAll(async () => {
    app = await getDisposableTestApp({
      overrides: (moduleBuilder) => {
        moduleBuilder
          .overrideProvider(CommunsSecteursApiService)
          .useValue(communs);
      },
    });
    router = await getTestRouter(app);
    db = await getTestDatabase(app);

    const { collectivite, users } = await addTestCollectiviteAndUsers(db, {
      users: [
        { role: CollectiviteRole.EDITION },
        { role: CollectiviteRole.LECTURE },
      ],
    });
    collectiviteId = collectivite.id;
    editeur = getAuthUserFromUserCredentials(users[0]);
    lecteur = getAuthUserFromUserCredentials(users[1]);

    const [pcaetType] = await db.db
      .select({ id: planActionTypeTable.id })
      .from(planActionTypeTable)
      .where(
        and(
          eq(planActionTypeTable.categorie, PCAET_PLAN_TYPE_KEY.categorie),
          eq(planActionTypeTable.type, PCAET_PLAN_TYPE_KEY.type)
        )
      );
    pcaetTypeId = pcaetType.id;

    return async () => {
      await app.close();
    };
  });

  const ficheHorsPlan = () =>
    createFiche({
      caller: router.createCaller({ user: editeur }),
      ficheInput: { titre: 'Fiche secteurs', collectiviteId },
    });

  const nouvelleFichePcaet = async () => {
    const ficheId = await ficheHorsPlan();
    const [plan] = await db.db
      .insert(axeTable)
      .values({ nom: 'Plan PCAET', collectiviteId, typeId: pcaetTypeId })
      .returning({ id: axeTable.id });
    await db.db
      .insert(ficheActionAxeTable)
      .values({ ficheId, axeId: plan.id, createdBy: editeur.id });
    return ficheId;
  };

  const upsertSecteurs = (
    ficheId: number,
    secteurs: SecteurReglementaire[],
    user = editeur
  ) =>
    router
      .createCaller({ user })
      .plans.fiches.upsertSecteurs({ ficheId, secteurs });

  const getSecteurs = (ficheId: number, user = editeur) =>
    router.createCaller({ user }).plans.fiches.getSecteurs({ ficheId });

  const getAttribution = async (ficheId: number) => {
    const [row] = await db.db
      .select()
      .from(ficheActionSecteurAttributionTable)
      .where(eq(ficheActionSecteurAttributionTable.ficheId, ficheId));
    return row ?? null;
  };

  test('remplace une attribution automatique par la saisie : origine manuelle, methode et réponse Communs vidées', async () => {
    const ficheId = await nouvelleFichePcaet();
    communs.repondParts(ficheId, { dechets: 0.9 });
    await getSecteurs(ficheId);

    expect(
      await upsertSecteurs(ficheId, ['agriculture', 'residentiel'])
    ).toEqual({
      etat: 'attribue',
      secteurs: ['agriculture', 'residentiel'],
      origine: 'manuelle',
    });

    expect(await getAttribution(ficheId)).toMatchObject({
      secteurs: ['agriculture', 'residentiel'],
      origine: 'manuelle',
      methode: null,
      reponseCommuns: null,
      modifiedBy: editeur.id,
    });
  });

  test('une lecture suivante renvoie la saisie sans appeler Communs', async () => {
    const ficheId = await nouvelleFichePcaet();
    communs.repondParts(ficheId, { dechets: 0.9 });

    await upsertSecteurs(ficheId, ['tertiaire']);

    expect(await getSecteurs(ficheId)).toEqual({
      etat: 'attribue',
      secteurs: ['tertiaire'],
      origine: 'manuelle',
    });
    expect(communs.getNombreAppels(ficheId)).toBe(0);
  });

  test('une liste vide déclare la fiche non attribuable par la collectivité', async () => {
    const ficheId = await nouvelleFichePcaet();

    expect(await upsertSecteurs(ficheId, [])).toEqual({
      etat: 'non_attribuable',
      origine: 'manuelle',
    });
    expect(await getAttribution(ficheId)).toMatchObject({
      secteurs: [],
      origine: 'manuelle',
    });
  });

  test('une fiche « à renseigner » (inconnue de Communs) peut être renseignée à la main', async () => {
    const ficheId = await nouvelleFichePcaet();
    await db.db.insert(ficheActionSecteurAttributionTable).values({
      ficheId,
      secteurs: [],
      origine: 'indisponible',
    });

    expect(await upsertSecteurs(ficheId, ['dechets'])).toEqual({
      etat: 'attribue',
      secteurs: ['dechets'],
      origine: 'manuelle',
    });
  });

  test('une fiche sans attribution, hors PCAET, peut être renseignée à la main', async () => {
    const ficheId = await ficheHorsPlan();

    expect(await upsertSecteurs(ficheId, ['branche_energie'])).toEqual({
      etat: 'attribue',
      secteurs: ['branche_energie'],
      origine: 'manuelle',
    });
    expect(await getSecteurs(ficheId)).toEqual({
      etat: 'attribue',
      secteurs: ['branche_energie'],
      origine: 'manuelle',
    });
  });

  test('un secteur cité deux fois n’est enregistré qu’une fois', async () => {
    const ficheId = await ficheHorsPlan();

    expect(await upsertSecteurs(ficheId, ['dechets', 'dechets'])).toEqual({
      etat: 'attribue',
      secteurs: ['dechets'],
      origine: 'manuelle',
    });
  });

  test('un lecteur reçoit une erreur de permission, et rien n’est écrit', async () => {
    const ficheId = await ficheHorsPlan();

    await expect(
      upsertSecteurs(ficheId, ['dechets'], lecteur)
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(await getAttribution(ficheId)).toBeNull();
  });

  test('seuls les 8 secteurs réglementaires sont acceptés', async () => {
    const ficheId = await ficheHorsPlan();

    await expect(
      upsertSecteurs(ficheId, ['transports' as unknown as SecteurReglementaire])
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(await getAttribution(ficheId)).toBeNull();
  });

  test('ne modifie pas la fiche et n’envoie pas de webhook', async () => {
    const ficheId = await nouvelleFichePcaet();
    const getModifiedAt = async () => {
      const [fiche] = await db.db
        .select({ modifiedAt: ficheActionTable.modifiedAt })
        .from(ficheActionTable)
        .where(eq(ficheActionTable.id, ficheId));
      return fiche.modifiedAt;
    };
    const modifiedAtAvant = await getModifiedAt();
    const webhookSpy = vi.spyOn(
      app.get(WebhookService),
      'sendWebhookNotification'
    );
    onTestFinished(() => webhookSpy.mockRestore());

    await upsertSecteurs(ficheId, ['agriculture']);

    expect(await getModifiedAt()).toBe(modifiedAtAvant);
    expect(webhookSpy).not.toHaveBeenCalled();
  });
});
