import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getDisposableTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { WebhookService } from '@tet/backend/utils/webhooks/webhook.service';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { demarchePlanActionTable } from '@tet/backend/demarches/shared/models/demarche-plan-action.table';
import {
  DemarchePcaetStatus,
  DemarchePcaetStatusEnum,
  DemarcheTypeEnum,
  PCAET_PLAN_TYPE_KEY,
} from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq, ne, sql } from 'drizzle-orm';
import { onTestFinished, vi } from 'vitest';
import { createFiche } from '../fiches.test-fixture';
import { axeTable } from '../shared/models/axe.table';
import { ficheActionAxeTable } from '../shared/models/fiche-action-axe.table';
import { ficheActionTable } from '../shared/models/fiche-action.table';
import { planActionTypeTable } from '../shared/models/plan-action-type.table';
import { CommunsSecteursApiService } from './communs-secteurs-api.service';
import { FakeCommunsSecteursApiService } from './communs-secteurs-api.test-fixture';
import { ficheActionSecteurAttributionTable } from './fiche-action-secteur-attribution.table';
import { DELAI_404_DEFINITIF_MS } from './fiche-secteurs.rules';

describe('Lecture des secteurs d’une fiche', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;
  const communs = new FakeCommunsSecteursApiService();

  let editeur: AuthenticatedUser;
  let lecteur: AuthenticatedUser;
  let collectiviteId: number;
  let visiteur: AuthenticatedUser;
  let pcaetTypeId: number;
  let autreTypeId: number;

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

    const { user: visiteurVerifie } = await addTestUser(db, {
      collectiviteId: null,
      role: CollectiviteRole.LECTURE,
    });
    visiteur = getAuthUserFromUserCredentials(visiteurVerifie);

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
    const [autreType] = await db.db
      .select({ id: planActionTypeTable.id })
      .from(planActionTypeTable)
      .where(ne(planActionTypeTable.id, pcaetTypeId))
      .limit(1);
    autreTypeId = autreType.id;

    return async () => {
      await app.close();
    };
  });

  const creePlan = async (typeId: number | null) => {
    const [plan] = await db.db
      .insert(axeTable)
      .values({ nom: 'Plan secteurs', collectiviteId, typeId })
      .returning({ id: axeTable.id });
    return plan.id;
  };

  const creeAxe = async (planId: number) => {
    const [axe] = await db.db
      .insert(axeTable)
      .values({ nom: 'Axe', collectiviteId, plan: planId, parent: planId })
      .returning({ id: axeTable.id });
    return axe.id;
  };

  const rangeFiche = (ficheId: number, axeId: number) =>
    db.db
      .insert(ficheActionAxeTable)
      .values({ ficheId, axeId, createdBy: editeur.id });

  const lieADemarchePcaet = async (
    planId: number,
    status: DemarchePcaetStatus
  ) => {
    const [demarche] = await db.db
      .insert(demarcheTable)
      .values({
        collectiviteId,
        type: DemarcheTypeEnum.PCAET,
        titre: 'PCAET',
        status,
      })
      .returning({ id: demarcheTable.id });
    await db.db
      .insert(demarchePlanActionTable)
      .values({ demarcheId: demarche.id, planActionId: planId });
  };

  const antidate = (ficheId: number, ms: number) =>
    db.db
      .update(ficheActionTable)
      .set({ modifiedAt: sql`now() - ${ms} * interval '1 millisecond'` })
      .where(eq(ficheActionTable.id, ficheId));

  const UNE_MINUTE_MS = 60 * 1000;

  const creeSousAction = async (parentId: number) => {
    const [sousAction] = await db.db
      .insert(ficheActionTable)
      .values({ titre: 'Sous-action', collectiviteId, parentId })
      .returning({ id: ficheActionTable.id });
    onTestFinished(async () => {
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, sousAction.id));
    });
    return sousAction.id;
  };

  const ficheHorsPlan = () =>
    createFiche({
      caller: router.createCaller({ user: editeur }),
      ficheInput: { titre: 'Fiche secteurs', collectiviteId },
    });

  const nouvelleFiche = async () => {
    const ficheId = await ficheHorsPlan();
    await rangeFiche(ficheId, await creePlan(pcaetTypeId));
    return ficheId;
  };

  const getSecteurs = (ficheId: number, user = editeur) =>
    router.createCaller({ user }).plans.fiches.getSecteurs({ ficheId });

  const getAttribution = async (ficheId: number) => {
    const [row] = await db.db
      .select()
      .from(ficheActionSecteurAttributionTable)
      .where(eq(ficheActionSecteurAttributionTable.ficheId, ficheId));
    return row ?? null;
  };

  test('fiche jamais demandée : appelle Communs, écrit une attribution automatique et renvoie les secteurs ≥ 0,2', async () => {
    const ficheId = await nouvelleFiche();
    communs.repondParts(ficheId, { dechets: 0.75, tertiaire: 0.06 });

    expect(await getSecteurs(ficheId)).toEqual({
      etat: 'attribue',
      secteurs: ['dechets'],
      origine: 'automatique',
    });

    const attribution = await getAttribution(ficheId);
    expect(attribution).toMatchObject({
      secteurs: ['dechets'],
      origine: 'automatique',
      methode: 'mapping-test/agregation-test',
      modifiedBy: null,
    });
    expect(attribution?.reponseCommuns).toMatchObject({
      id: `communs-${ficheId}`,
      secteursDirect: { parts: { dechets: 0.75, tertiaire: 0.06 } },
    });
  });

  test('plusieurs parts ≥ 0,2 : renvoie plusieurs secteurs, sans rappeler Communs ensuite', async () => {
    const ficheId = await nouvelleFiche();
    communs.repondParts(ficheId, { residentiel: 0.4, branche_energie: 0.3 });

    const attendu = {
      etat: 'attribue',
      secteurs: ['residentiel', 'branche_energie'],
      origine: 'automatique',
    };
    expect(await getSecteurs(ficheId)).toEqual(attendu);
    expect(await getSecteurs(ficheId)).toEqual(attendu);
    expect(communs.getNombreAppels(ficheId)).toBe(1);
  });

  test('aucune part ≥ 0,2 : écrit des secteurs vides, renvoie « non attribuable », sans rappeler Communs', async () => {
    const ficheId = await nouvelleFiche();
    communs.repondParts(ficheId, { dechets: 0.04 });

    expect(await getSecteurs(ficheId)).toEqual({
      etat: 'non_attribuable',
      origine: 'automatique',
    });
    expect(await getAttribution(ficheId)).toMatchObject({
      secteurs: [],
      origine: 'automatique',
    });

    expect(await getSecteurs(ficheId)).toEqual({
      etat: 'non_attribuable',
      origine: 'automatique',
    });
    expect(communs.getNombreAppels(ficheId)).toBe(1);
  });

  test('fiche pas encore classée par Communs : « en cours de calcul », rien n’est écrit, la lecture suivante redemande', async () => {
    const ficheId = await nouvelleFiche();
    communs.repondPasEncoreCalculee(ficheId);

    expect(await getSecteurs(ficheId)).toEqual({ etat: 'en_cours_de_calcul' });
    expect(await getAttribution(ficheId)).toBeNull();

    communs.repondParts(ficheId, { agriculture: 0.9 });
    expect(await getSecteurs(ficheId)).toEqual({
      etat: 'attribue',
      secteurs: ['agriculture'],
      origine: 'automatique',
    });
    expect(communs.getNombreAppels(ficheId)).toBe(2);
  });

  test('fiche pas encore classée : la fiche Communs est demandée, sans classification, rien n’est écrit', async () => {
    const ficheId = await nouvelleFiche();
    communs.repondPasEncoreCalculee(ficheId);

    expect(await getSecteurs(ficheId)).toEqual({ etat: 'en_cours_de_calcul' });
    expect(communs.getNombreAppelsAction(ficheId)).toBe(1);
    expect(await getAttribution(ficheId)).toBeNull();
  });

  test('fiche classée mais muette : écrit des secteurs vides, renvoie « non attribuable », sans rappeler Communs', async () => {
    const ficheId = await nouvelleFiche();
    communs.repondMuette(ficheId);

    expect(await getSecteurs(ficheId)).toEqual({
      etat: 'non_attribuable',
      origine: 'automatique',
    });
    const attribution = await getAttribution(ficheId);
    expect(attribution).toMatchObject({
      secteurs: [],
      origine: 'automatique',
      methode: 'mapping-test/agregation-test',
    });
    expect(attribution?.reponseCommuns).toMatchObject({
      secteursDirect: null,
    });

    expect(await getSecteurs(ficheId)).toEqual({
      etat: 'non_attribuable',
      origine: 'automatique',
    });
    expect(communs.getNombreAppels(ficheId)).toBe(1);
    expect(communs.getNombreAppelsAction(ficheId)).toBe(1);
  });

  test('fiche avec des secteurs : la fiche Communs n’est pas demandée', async () => {
    const ficheId = await nouvelleFiche();
    communs.repondParts(ficheId, { dechets: 0.9 });

    await getSecteurs(ficheId);
    expect(communs.getNombreAppelsAction(ficheId)).toBe(0);
  });

  test('404 sur une fiche non modifiée depuis plus de 30 min : écrit une attribution indisponible, renvoie « à renseigner », sans rappeler Communs', async () => {
    const ficheId = await nouvelleFiche();
    await antidate(ficheId, DELAI_404_DEFINITIF_MS + UNE_MINUTE_MS);
    communs.repondInconnue(ficheId);

    expect(await getSecteurs(ficheId)).toEqual({ etat: 'a_renseigner' });
    expect(await getAttribution(ficheId)).toMatchObject({
      secteurs: [],
      origine: 'indisponible',
      methode: null,
      reponseCommuns: null,
    });

    expect(await getSecteurs(ficheId)).toEqual({ etat: 'a_renseigner' });
    expect(communs.getNombreAppels(ficheId)).toBe(1);
  });

  test('404 sur une fiche modifiée il y a moins de 30 min : « en cours de calcul », rien n’est écrit', async () => {
    const ficheId = await nouvelleFiche();
    await antidate(ficheId, DELAI_404_DEFINITIF_MS - UNE_MINUTE_MS);
    communs.repondInconnue(ficheId);

    expect(await getSecteurs(ficheId)).toEqual({ etat: 'en_cours_de_calcul' });
    expect(await getAttribution(ficheId)).toBeNull();
  });

  test('fiche sans titre : Communs n’est pas appelé, rien n’est écrit, « en cours de calcul »', async () => {
    const ficheId = await nouvelleFiche();
    await db.db
      .update(ficheActionTable)
      .set({ titre: null })
      .where(eq(ficheActionTable.id, ficheId));
    communs.repondParts(ficheId, { dechets: 0.9 });

    expect(await getSecteurs(ficheId)).toEqual({ etat: 'en_cours_de_calcul' });
    expect(communs.getNombreAppels(ficheId)).toBe(0);
    expect(await getAttribution(ficheId)).toBeNull();
  });

  test('Communs injoignable : la lecture réussit en « en cours de calcul » et n’écrit rien', async () => {
    const ficheId = await nouvelleFiche();
    communs.echoue(ficheId);

    expect(await getSecteurs(ficheId)).toEqual({ etat: 'en_cours_de_calcul' });
    expect(await getAttribution(ficheId)).toBeNull();
  });

  test('deux premières lectures simultanées : une seule attribution, aucune erreur', async () => {
    const ficheId = await nouvelleFiche();
    communs.repondParts(ficheId, { tertiaire: 0.5 });

    const resultats = await Promise.all([
      getSecteurs(ficheId),
      getSecteurs(ficheId),
    ]);
    expect(resultats).toEqual([
      { etat: 'attribue', secteurs: ['tertiaire'], origine: 'automatique' },
      { etat: 'attribue', secteurs: ['tertiaire'], origine: 'automatique' },
    ]);
  });

  test('une attribution déjà en base n’est jamais écrasée par Communs', async () => {
    const ficheId = await nouvelleFiche();
    await db.db.insert(ficheActionSecteurAttributionTable).values({
      ficheId,
      secteurs: ['agriculture'],
      origine: 'manuelle',
    });
    communs.repondParts(ficheId, { dechets: 0.9 });

    expect(await getSecteurs(ficheId)).toEqual({
      etat: 'attribue',
      secteurs: ['agriculture'],
      origine: 'manuelle',
    });
    expect(communs.getNombreAppels(ficheId)).toBe(0);
  });

  test('lire les secteurs ne modifie pas la fiche et n’envoie pas de webhook', async () => {
    const ficheId = await nouvelleFiche();
    communs.repondParts(ficheId, { dechets: 0.9 });

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

    await getSecteurs(ficheId);

    expect(await getModifiedAt()).toBe(modifiedAtAvant);
    expect(webhookSpy).not.toHaveBeenCalled();
  });

  test('un lecteur de la collectivité voit les secteurs', async () => {
    const ficheId = await nouvelleFiche();
    communs.repondParts(ficheId, { dechets: 0.9 });

    expect(await getSecteurs(ficheId, lecteur)).toEqual({
      etat: 'attribue',
      secteurs: ['dechets'],
      origine: 'automatique',
    });
  });

  test('un visiteur qui ne peut pas lire une fiche restreinte est refusé, et Communs n’est pas appelé', async () => {
    const [{ id: ficheId }] = await db.db
      .insert(ficheActionTable)
      .values({ titre: 'Fiche restreinte', restreint: true, collectiviteId })
      .returning();
    onTestFinished(async () => {
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, ficheId));
    });
    communs.repondParts(ficheId, { dechets: 0.9 });

    await expect(getSecteurs(ficheId, visiteur)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
    expect(communs.getNombreAppels(ficheId)).toBe(0);
  });
  describe('Éligibilité : seules les fiches PCAET sont demandées à Communs', () => {
    const expectNonConcernee = async (ficheId: number) => {
      communs.repondParts(ficheId, { dechets: 0.9 });
      expect(await getSecteurs(ficheId)).toEqual({ etat: 'non_renseigne' });
      expect(communs.getNombreAppels(ficheId)).toBe(0);
      expect(await getAttribution(ficheId)).toBeNull();
    };

    const expectConcernee = async (ficheId: number) => {
      communs.repondParts(ficheId, { dechets: 0.9 });
      expect(await getSecteurs(ficheId)).toEqual({
        etat: 'attribue',
        secteurs: ['dechets'],
        origine: 'automatique',
      });
      expect(communs.getNombreAppels(ficheId)).toBe(1);
    };

    test('fiche d’un sous-axe d’un plan de type PCAET : concernée', async () => {
      const ficheId = await ficheHorsPlan();
      await rangeFiche(ficheId, await creeAxe(await creePlan(pcaetTypeId)));
      await expectConcernee(ficheId);
    });

    test('fiche d’un plan d’un autre type lié à une démarche PCAET : concernée', async () => {
      const ficheId = await ficheHorsPlan();
      const planId = await creePlan(autreTypeId);
      await lieADemarchePcaet(planId, DemarchePcaetStatusEnum.EN_ELABORATION);
      await rangeFiche(ficheId, planId);
      await expectConcernee(ficheId);
    });

    test('fiche d’un plan lié à une démarche PCAET archivée : concernée', async () => {
      const ficheId = await ficheHorsPlan();
      const planId = await creePlan(null);
      await lieADemarchePcaet(planId, DemarchePcaetStatusEnum.ARCHIVE);
      await rangeFiche(ficheId, await creeAxe(planId));
      await expectConcernee(ficheId);
    });

    test('fiche de plusieurs plans dont un seul PCAET : concernée', async () => {
      const ficheId = await ficheHorsPlan();
      await rangeFiche(ficheId, await creePlan(autreTypeId));
      await rangeFiche(ficheId, await creePlan(pcaetTypeId));
      await expectConcernee(ficheId);
    });

    test('fiche hors PCAET : « non renseigné », sans appel à Communs ni écriture', async () => {
      const ficheId = await ficheHorsPlan();
      await rangeFiche(ficheId, await creePlan(autreTypeId));
      await expectNonConcernee(ficheId);
    });

    test('fiche sans plan : « non renseigné »', async () => {
      await expectNonConcernee(await ficheHorsPlan());
    });

    test('sous-action d’une fiche concernée : concernée, avec ses propres secteurs', async () => {
      const parentId = await nouvelleFiche();
      communs.repondParts(parentId, { dechets: 0.9 });
      const sousActionId = await creeSousAction(parentId);
      communs.repondParts(sousActionId, { agriculture: 0.6 });

      expect(await getSecteurs(sousActionId)).toEqual({
        etat: 'attribue',
        secteurs: ['agriculture'],
        origine: 'automatique',
      });
      expect(communs.getNombreAppels(sousActionId)).toBe(1);
      expect(communs.getNombreAppels(parentId)).toBe(0);
    });

    test('sous-action d’une fiche non concernée : « non renseigné »', async () => {
      const parentId = await ficheHorsPlan();
      await rangeFiche(parentId, await creePlan(autreTypeId));
      await expectNonConcernee(await creeSousAction(parentId));
    });

    test('une attribution existante s’affiche même si la fiche n’est plus concernée', async () => {
      const ficheId = await ficheHorsPlan();
      await db.db.insert(ficheActionSecteurAttributionTable).values({
        ficheId,
        secteurs: ['agriculture'],
        origine: 'automatique',
      });
      expect(await getSecteurs(ficheId)).toEqual({
        etat: 'attribue',
        secteurs: ['agriculture'],
        origine: 'automatique',
      });
      expect(communs.getNombreAppels(ficheId)).toBe(0);
    });
  });
});
