import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { CompleteFicheSecteursService } from '@tet/backend/plans/fiches/fiche-secteurs/complete-fiche-secteurs.service';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { CommunsSecteursApiService } from '@tet/backend/plans/fiches/fiche-secteurs/communs-secteurs-api.service';
import { FakeCommunsSecteursApiService } from '@tet/backend/plans/fiches/fiche-secteurs/communs-secteurs-api.test-fixture';
import { ficheActionSecteurAttributionTable } from '@tet/backend/plans/fiches/fiche-secteurs/fiche-action-secteur-attribution.table';
import { DELAI_404_DEFINITIF_MS } from '@tet/backend/plans/fiches/fiche-secteurs/fiche-secteurs.rules';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { ficheActionAxeTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-axe.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { planActionTypeTable } from '@tet/backend/plans/fiches/shared/models/plan-action-type.table';
import { getDisposableTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { WebhookService } from '@tet/backend/utils/webhooks/webhook.service';
import { PCAET_PLAN_TYPE_KEY } from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq, inArray, ne, sql } from 'drizzle-orm';
import { onTestFinished, vi } from 'vitest';
import {
  BackfillFicheSecteursModule,
  runBackfillFicheSecteurs,
} from './backfill-fiche-secteurs';

describe('Remplissage des secteurs du stock', () => {
  let app: INestApplication;
  let db: DatabaseService;
  const communs = new FakeCommunsSecteursApiService();
  let pcaetTypeId: number;
  let autreTypeId: number;
  let userId: string;

  beforeAll(async () => {
    app = await getDisposableTestApp({
      overrides: (moduleBuilder) => {
        moduleBuilder
          .overrideProvider(CommunsSecteursApiService)
          .useValue(communs);
      },
    });
    db = await getTestDatabase(app);

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

  const createCollectivite = async () => {
    const { collectivite, user } = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    userId = user.id;
    return collectivite.id;
  };

  const createFiche = async (
    collectiviteId: number,
    {
      typeId = pcaetTypeId,
      parentId,
      deleted = false,
    }: { typeId?: number | null; parentId?: number; deleted?: boolean } = {}
  ) => {
    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({
        titre: 'Fiche du stock',
        collectiviteId,
        parentId,
        deleted,
        modifiedAt: sql`now() - ${
          DELAI_404_DEFINITIF_MS * 2
        } * interval '1 millisecond'`,
      })
      .returning({ id: ficheActionTable.id });
    onTestFinished(async () => {
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, fiche.id));
    });
    if (parentId === undefined) {
      const [plan] = await db.db
        .insert(axeTable)
        .values({ nom: 'Plan', collectiviteId, typeId })
        .returning({ id: axeTable.id });
      await db.db
        .insert(ficheActionAxeTable)
        .values({ ficheId: fiche.id, axeId: plan.id, createdBy: userId });
    }
    return fiche.id;
  };

  const getAttributions = (ficheIds: number[]) =>
    db.db
      .select()
      .from(ficheActionSecteurAttributionTable)
      .where(inArray(ficheActionSecteurAttributionTable.ficheId, ficheIds));

  const getOrigines = async (ficheIds: number[]) =>
    Object.fromEntries(
      (await getAttributions(ficheIds)).map((attribution) => [
        attribution.ficheId,
        { origine: attribution.origine, secteurs: attribution.secteurs },
      ])
    );

  const run = (collectiviteId: number, confirm: boolean) =>
    runBackfillFicheSecteurs(app, {
      collectiviteId,
      confirm,
      intervalMs: 0,
    });

  test('à blanc : compte les fiches concernées sans attribution, sans appeler Communs ni rien écrire', async () => {
    const collectiviteId = await createCollectivite();
    const fiches = [
      await createFiche(collectiviteId),
      await createFiche(collectiviteId),
    ];

    const result = await run(collectiviteId, false);

    expect(result).toMatchObject({ toProcess: 2 });
    expect(fiches.map((ficheId) => communs.getNombreAppels(ficheId))).toEqual([
      0, 0,
    ]);
    expect(await getAttributions(fiches)).toEqual([]);
  });

  test('avec confirmation : chaque fiche concernée sans attribution reçoit une attribution selon les règles de lecture, et les comptes correspondent', async () => {
    const collectiviteId = await createCollectivite();
    const attribuee = await createFiche(collectiviteId);
    const sousAction = await createFiche(collectiviteId, {
      parentId: attribuee,
    });
    const muette = await createFiche(collectiviteId);
    const enFile = await createFiche(collectiviteId);
    const inconnue = await createFiche(collectiviteId);
    communs.repondParts(attribuee, { dechets: 0.9 });
    communs.repondParts(sousAction, { agriculture: 0.5 });
    communs.repondMuette(muette);
    communs.repondPasEncoreCalculee(enFile);
    communs.repondInconnue(inconnue);

    const result = await run(collectiviteId, true);

    expect(result).toEqual({
      toProcess: 5,
      attribuees: 2,
      nonAttribuables: 1,
      enCoursDeCalcul: 1,
      indisponibles: 1,
      failed: 0,
    });
    expect(
      await getOrigines([attribuee, sousAction, muette, enFile, inconnue])
    ).toEqual({
      [attribuee]: { origine: 'automatique', secteurs: ['dechets'] },
      [sousAction]: { origine: 'automatique', secteurs: ['agriculture'] },
      [muette]: { origine: 'automatique', secteurs: [] },
      [inconnue]: { origine: 'indisponible', secteurs: [] },
    });
  });

  test('ignore les fiches déjà attribuées, hors PCAET, supprimées (ou dont la parente l’est) ou d’une autre collectivité', async () => {
    const collectiviteId = await createCollectivite();
    const manuelle = await createFiche(collectiviteId);
    await db.db.insert(ficheActionSecteurAttributionTable).values({
      ficheId: manuelle,
      secteurs: ['tertiaire'],
      origine: 'manuelle',
    });
    const horsPcaet = await createFiche(collectiviteId, {
      typeId: autreTypeId,
    });
    const supprimee = await createFiche(collectiviteId, { deleted: true });
    const sousActionDeSupprimee = await createFiche(collectiviteId, {
      parentId: supprimee,
    });
    const autreCollectivite = await createFiche(await createCollectivite());
    for (const ficheId of [
      manuelle,
      horsPcaet,
      supprimee,
      sousActionDeSupprimee,
      autreCollectivite,
    ]) {
      communs.repondParts(ficheId, { dechets: 0.9 });
    }

    const result = await run(collectiviteId, true);

    expect(result).toMatchObject({ toProcess: 0 });
    expect(
      [
        manuelle,
        horsPcaet,
        supprimee,
        sousActionDeSupprimee,
        autreCollectivite,
      ].map((ficheId) => communs.getNombreAppels(ficheId))
    ).toEqual([0, 0, 0, 0, 0]);
    expect(await getOrigines([manuelle])).toEqual({
      [manuelle]: { origine: 'manuelle', secteurs: ['tertiaire'] },
    });
    expect(
      await getAttributions([
        horsPcaet,
        supprimee,
        sousActionDeSupprimee,
        autreCollectivite,
      ])
    ).toEqual([]);
  });

  test('relancé, il ne reprend que les fiches restées sans attribution', async () => {
    const collectiviteId = await createCollectivite();
    const attribuee = await createFiche(collectiviteId);
    const enFile = await createFiche(collectiviteId);
    communs.repondParts(attribuee, { dechets: 0.9 });
    communs.repondPasEncoreCalculee(enFile);
    await run(collectiviteId, true);

    communs.repondParts(enFile, { residentiel: 0.7 });
    const result = await run(collectiviteId, true);

    expect(result).toMatchObject({ toProcess: 1, attribuees: 1 });
    expect(communs.getNombreAppels(attribuee)).toBe(1);
    expect(communs.getNombreAppels(enFile)).toBe(2);
    expect(await getOrigines([enFile])).toEqual({
      [enFile]: { origine: 'automatique', secteurs: ['residentiel'] },
    });
  });

  test('ne modifie pas les fiches et n’envoie pas de webhook', async () => {
    const collectiviteId = await createCollectivite();
    const ficheId = await createFiche(collectiviteId);
    communs.repondParts(ficheId, { dechets: 0.9 });
    const getFiche = async () => {
      const [fiche] = await db.db
        .select()
        .from(ficheActionTable)
        .where(eq(ficheActionTable.id, ficheId));
      return fiche;
    };
    const ficheBefore = await getFiche();
    const webhookSpy = vi.spyOn(
      app.get(WebhookService),
      'sendWebhookNotification'
    );
    onTestFinished(() => webhookSpy.mockRestore());

    await run(collectiviteId, true);

    expect(await getFiche()).toEqual(ficheBefore);
    expect(webhookSpy).not.toHaveBeenCalled();
  });
});

test('le module du script démarre seul, sans le reste du backend', async () => {
  const context = await NestFactory.createApplicationContext(
    BackfillFicheSecteursModule,
    { logger: false }
  );
  const hasService =
    context.get(CompleteFicheSecteursService) instanceof
    CompleteFicheSecteursService;
  await context.close();

  expect(hasService).toBe(true);
});
