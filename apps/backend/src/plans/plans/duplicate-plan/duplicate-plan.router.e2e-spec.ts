import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { createIndicateurPerso } from '@tet/backend/indicateurs/definitions/definitions.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite, TagEnum, TagType } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { onTestFinished } from 'vitest';

describe('Dupliquer un plan', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  let collectivite: Collectivite;
  let editorUser: AuthenticatedUser;
  let noAccessUser: AuthenticatedUser;

  beforeAll(async () => {
    app = await getTestApp();
    router = await app.get(TrpcRouter);
    db = await getTestDatabase(app);

    const testCollectiviteAndUserResult = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: { accesRestreint: true },
    });

    collectivite = testCollectiviteAndUserResult.collectivite;
    editorUser = getAuthUserFromUserCredentials(
      testCollectiviteAndUserResult.user
    );

    const noAccessUserResult = await addTestUser(db);
    noAccessUser = getAuthUserFromUserCredentials(noAccessUserResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  const buildEditorCaller = () => router.createCaller({ user: editorUser });

  const cleanupPlans = (planIds: number[]) => {
    onTestFinished(async () => {
      const cleanupCaller = buildEditorCaller();
      for (const planId of planIds) {
        try {
          await cleanupCaller.plans.plans.delete({ planId });
        } catch {
          // déjà supprimé
        }
      }
    });
  };

  test('duplique un plan avec son arborescence, ses fiches et sous-actions', async () => {
    const caller = buildEditorCaller();

    const sourcePlan = await caller.plans.plans.create({
      nom: 'Plan source',
      collectiviteId: collectivite.id,
    });
    const axe1 = await caller.plans.axes.create({
      nom: 'Axe 1',
      collectiviteId: collectivite.id,
      planId: sourcePlan.id,
      parent: sourcePlan.id,
    });
    const axe11 = await caller.plans.axes.create({
      nom: 'Axe 1.1',
      collectiviteId: collectivite.id,
      planId: sourcePlan.id,
      parent: axe1.id,
    });
    const axe111 = await caller.plans.axes.create({
      nom: 'Axe 1.1.1',
      collectiviteId: collectivite.id,
      planId: sourcePlan.id,
      parent: axe11.id,
    });

    const sourceFiche = await caller.plans.fiches.create({
      fiche: {
        collectiviteId: collectivite.id,
        titre: 'Action A',
        objectifs: 'Objectifs A',
        statut: 'En cours',
        priorite: 'Élevé',
        restreint: true,
      },
      ficheFields: { axes: [{ id: axe111.id }] },
    });
    await caller.plans.fiches.create({
      fiche: {
        collectiviteId: collectivite.id,
        titre: 'Sous-action A1',
        description: 'Description sous-action',
        parentId: sourceFiche.id,
      },
    });

    const duplicated = await caller.plans.plans.duplicate({
      planId: sourcePlan.id,
    });
    cleanupPlans([sourcePlan.id, duplicated.planId]);

    expect(duplicated.planId).not.toBe(sourcePlan.id);

    const newPlan = await caller.plans.plans.get({ planId: duplicated.planId });
    expect(newPlan.nom).toContain('Plan source');
    expect(newPlan.nom).toContain('(copie du');
    expect(newPlan.nom).not.toBe('Plan source');
    const newAxeNoms = newPlan.axes.map((axe) => axe.nom);
    expect(newAxeNoms).toContain('Axe 1');
    expect(newAxeNoms).toContain('Axe 1.1');
    expect(newAxeNoms).toContain('Axe 1.1.1');

    const newAxe111Id = newPlan.axes.find((axe) => axe.nom === 'Axe 1.1.1')?.id;
    expect(newAxe111Id).toBeDefined();

    const { data: newParents } = await caller.plans.fiches.listFiches({
      collectiviteId: collectivite.id,
      filters: { planActionIds: [duplicated.planId] },
      queryOptions: { limit: 'all' },
    });
    expect(newParents.length).toBe(1);

    const newParent = newParents[0];
    expect(newParent.titre).toBe('Action A');
    expect(newParent.objectifs).toBe('Objectifs A');
    expect(newParent.statut).toBe('En cours');
    expect(newParent.priorite).toBe('Élevé');
    expect(newParent.restreint).toBe(true);
    expect(newParent.id).not.toBe(sourceFiche.id);
    expect(newParent.axes?.map((axe) => axe.id)).toEqual([newAxe111Id]);

    const { data: newSousActions } = await caller.plans.fiches.listFiches({
      collectiviteId: collectivite.id,
      filters: { parentsId: [newParent.id] },
      queryOptions: { limit: 'all' },
    });
    expect(newSousActions.length).toBe(1);
    expect(newSousActions[0].titre).toBe('Sous-action A1');
    expect(newSousActions[0].description).toBe('Description sous-action');
    expect(newSousActions[0].parentId).toBe(newParent.id);
  });

  test('recrée toutes les appartenances aux axes pour une fiche multi-axes', async () => {
    const caller = buildEditorCaller();

    const sourcePlan = await caller.plans.plans.create({
      nom: 'Plan multi-axes',
      collectiviteId: collectivite.id,
    });
    const axeA = await caller.plans.axes.create({
      nom: 'Axe A',
      collectiviteId: collectivite.id,
      planId: sourcePlan.id,
      parent: sourcePlan.id,
    });
    const axeB = await caller.plans.axes.create({
      nom: 'Axe B',
      collectiviteId: collectivite.id,
      planId: sourcePlan.id,
      parent: sourcePlan.id,
    });

    await caller.plans.fiches.create({
      fiche: { collectiviteId: collectivite.id, titre: 'Action partagée' },
      ficheFields: { axes: [{ id: axeA.id }, { id: axeB.id }] },
    });

    const duplicated = await caller.plans.plans.duplicate({
      planId: sourcePlan.id,
    });
    cleanupPlans([sourcePlan.id, duplicated.planId]);

    const newPlan = await caller.plans.plans.get({ planId: duplicated.planId });
    const newAxeIds = newPlan.axes
      .filter((axe) => axe.id !== duplicated.planId)
      .map((axe) => axe.id);

    const { data: newFiches } = await caller.plans.fiches.listFiches({
      collectiviteId: collectivite.id,
      filters: { planActionIds: [duplicated.planId], withChildren: true },
      queryOptions: { limit: 'all' },
    });
    const newFiche = newFiches[0];
    const ficheAxeIds = (newFiche.axes ?? []).map((axe) => axe.id).sort();

    expect(ficheAxeIds).toEqual([...newAxeIds].sort());
    expect(ficheAxeIds).not.toContain(axeA.id);
    expect(ficheAxeIds).not.toContain(axeB.id);
  });

  test('duplique un plan vide', async () => {
    const caller = buildEditorCaller();

    const sourcePlan = await caller.plans.plans.create({
      nom: 'Plan vide',
      collectiviteId: collectivite.id,
    });

    const duplicated = await caller.plans.plans.duplicate({
      planId: sourcePlan.id,
    });
    cleanupPlans([sourcePlan.id, duplicated.planId]);

    const newPlan = await caller.plans.plans.get({ planId: duplicated.planId });
    expect(newPlan.nom).toContain('Plan vide');
    expect(newPlan.nom).toContain('(copie du');

    const { data: newFiches } = await caller.plans.fiches.listFiches({
      collectiviteId: collectivite.id,
      filters: { planActionIds: [duplicated.planId], withChildren: true },
      queryOptions: { limit: 'all' },
    });
    expect(newFiches.length).toBe(0);
  });

  test('préserve la confidentialité (restreint) des fiches dupliquées', async () => {
    const caller = buildEditorCaller();

    const sourcePlan = await caller.plans.plans.create({
      nom: 'Plan confidentiel',
      collectiviteId: collectivite.id,
    });
    const axe = await caller.plans.axes.create({
      nom: 'Axe confidentiel',
      collectiviteId: collectivite.id,
      planId: sourcePlan.id,
      parent: sourcePlan.id,
    });

    const ficheRestreinte = await caller.plans.fiches.create({
      fiche: {
        collectiviteId: collectivite.id,
        titre: 'Fiche restreinte',
        restreint: true,
      },
      ficheFields: { axes: [{ id: axe.id }] },
    });
    await caller.plans.fiches.create({
      fiche: {
        collectiviteId: collectivite.id,
        titre: 'Sous-action restreinte',
        restreint: true,
        parentId: ficheRestreinte.id,
      },
    });
    await caller.plans.fiches.create({
      fiche: {
        collectiviteId: collectivite.id,
        titre: 'Fiche publique',
        restreint: false,
      },
      ficheFields: { axes: [{ id: axe.id }] },
    });

    const duplicated = await caller.plans.plans.duplicate({
      planId: sourcePlan.id,
    });
    cleanupPlans([sourcePlan.id, duplicated.planId]);

    const { data: newParents } = await caller.plans.fiches.listFiches({
      collectiviteId: collectivite.id,
      filters: { planActionIds: [duplicated.planId] },
      queryOptions: { limit: 'all' },
    });
    const newRestreinte = newParents.find(
      (fiche) => fiche.titre === 'Fiche restreinte'
    );
    const newPublique = newParents.find(
      (fiche) => fiche.titre === 'Fiche publique'
    );
    expect(newRestreinte?.restreint).toBe(true);
    expect(newPublique?.restreint).toBe(false);

    expect(newRestreinte).toBeDefined();
    const { data: newSousActions } = await caller.plans.fiches.listFiches({
      collectiviteId: collectivite.id,
      filters: { parentsId: [newRestreinte?.id ?? 0] },
      queryOptions: { limit: 'all' },
    });
    expect(newSousActions.length).toBe(1);
    expect(newSousActions[0].titre).toBe('Sous-action restreinte');
    expect(newSousActions[0].restreint).toBe(true);
  });

  test('duplique exhaustivement une fiche avec tous ses champs renseignés', async () => {
    const caller = buildEditorCaller();

    const createTag = (tagType: TagType, nom: string) =>
      caller.collectivites.tags.create({
        tagType,
        nom,
        collectiviteId: collectivite.id,
      });

    const piloteTag = await createTag(TagEnum.Personne, 'Pilote exhaustif');
    const referentTag = await createTag(TagEnum.Personne, 'Référent exhaustif');
    const serviceTag = await createTag(TagEnum.Service, 'Service exhaustif');
    const structureTag = await createTag(TagEnum.Structure, 'Structure exhaustive');
    const partenaireTag = await createTag(
      TagEnum.Partenaire,
      'Partenaire exhaustif'
    );
    const libreTag = await createTag(TagEnum.Libre, 'Tag libre exhaustif');
    const instanceTag = await createTag(
      TagEnum.InstanceGouvernance,
      'Instance exhaustive'
    );
    const financeurTag = await createTag(TagEnum.Financeur, 'Financeur exhaustif');

    const [thematique] = await caller.shared.thematiques.list();
    const [sousThematique] =
      await caller.shared.thematiques.listSousThematiques();
    const [effetAttendu] = await caller.shared.effetsAttendus.list();
    const [temps] = await caller.shared.tempsDeMiseEnOeuvre.list();

    const indicateurId = await createIndicateurPerso({
      caller,
      indicateurData: {
        collectiviteId: collectivite.id,
        titre: 'Indicateur exhaustif',
        unite: 'kg',
      },
    });

    const sourcePlan = await caller.plans.plans.create({
      nom: 'Plan exhaustif',
      collectiviteId: collectivite.id,
    });
    const axe = await caller.plans.axes.create({
      nom: 'Axe exhaustif',
      collectiviteId: collectivite.id,
      planId: sourcePlan.id,
      parent: sourcePlan.id,
    });

    const sourceFiche = await caller.plans.fiches.create({
      fiche: {
        collectiviteId: collectivite.id,
        titre: 'Fiche exhaustive',
        description: 'Description complète',
        objectifs: 'Objectifs complets',
        ressources: 'Moyens complets',
        financements: 'Financements complets',
        cibles: ['Grand public', 'Associations'],
        piliersEci: ['Recyclage', 'Écoconception'],
        budgetPrevisionnel: '50000',
        statut: 'En cours',
        priorite: 'Élevé',
        dateDebut: '2026-01-15T00:00:00.000Z',
        dateFin: '2026-12-15T00:00:00.000Z',
        ameliorationContinue: true,
        participationCitoyenne: 'Concertation menée',
        participationCitoyenneType: 'concertation',
        majTermine: true,
        restreint: true,
      },
      ficheFields: {
        axes: [{ id: axe.id }],
        thematiques: [{ id: thematique.id }],
        sousThematiques: [{ id: sousThematique.id }],
        effetsAttendus: [{ id: effetAttendu.id }],
        partenaires: [{ id: partenaireTag.id }],
        structures: [{ id: structureTag.id }],
        services: [{ id: serviceTag.id }],
        pilotes: [{ tagId: piloteTag.id }],
        referents: [{ tagId: referentTag.id }],
        financeurs: [{ financeurTag: { id: financeurTag.id }, montantTtc: 12345 }],
        indicateurs: [{ id: indicateurId }],
        libreTags: [{ id: libreTag.id }],
        instanceGouvernance: [{ id: instanceTag.id }],
        tempsDeMiseEnOeuvre: { id: temps.id },
      },
    });
    await caller.plans.fiches.budgets.upsert([
      {
        ficheId: sourceFiche.id,
        type: 'investissement',
        unite: 'HT',
        annee: 2026,
        budgetPrevisionnel: 50000,
        budgetReel: 12000,
        estEtale: false,
      },
      {
        ficheId: sourceFiche.id,
        type: 'fonctionnement',
        unite: 'ETP',
        annee: 2026,
        budgetPrevisionnel: 2,
        budgetReel: null,
        estEtale: false,
      },
    ]);

    const duplicated = await caller.plans.plans.duplicate({
      planId: sourcePlan.id,
    });
    cleanupPlans([sourcePlan.id, duplicated.planId]);

    const { data: newParents } = await caller.plans.fiches.listFiches({
      collectiviteId: collectivite.id,
      filters: { planActionIds: [duplicated.planId] },
      queryOptions: { limit: 'all' },
    });
    expect(newParents.length).toBe(1);
    const dup = newParents[0];

    expect(dup.id).not.toBe(sourceFiche.id);
    expect(dup).toMatchObject({
      titre: 'Fiche exhaustive',
      description: 'Description complète',
      objectifs: 'Objectifs complets',
      ressources: 'Moyens complets',
      financements: 'Financements complets',
      budgetPrevisionnel: '50000',
      statut: 'En cours',
      priorite: 'Élevé',
      ameliorationContinue: true,
      participationCitoyenne: 'Concertation menée',
      participationCitoyenneType: 'concertation',
      majTermine: true,
      restreint: true,
    });
    expect(dup.cibles).toEqual(['Grand public', 'Associations']);
    expect(dup.piliersEci).toEqual(['Recyclage', 'Écoconception']);
    expect(dup.dateDebut).toContain('2026-01-15');
    expect(dup.dateFin).toContain('2026-12-15');

    expect(dup.thematiques?.map((item) => item.id)).toEqual([thematique.id]);
    expect(dup.sousThematiques?.map((item) => item.id)).toEqual([
      sousThematique.id,
    ]);
    expect(dup.effetsAttendus?.map((item) => item.id)).toEqual([
      effetAttendu.id,
    ]);
    expect(dup.partenaires?.map((item) => item.id)).toEqual([partenaireTag.id]);
    expect(dup.structures?.map((item) => item.id)).toEqual([structureTag.id]);
    expect(dup.services?.map((item) => item.id)).toEqual([serviceTag.id]);
    expect(dup.pilotes?.map((item) => item.tagId)).toEqual([piloteTag.id]);
    expect(dup.referents?.map((item) => item.tagId)).toEqual([referentTag.id]);
    expect(dup.libreTags?.map((item) => item.id)).toEqual([libreTag.id]);
    expect(dup.instanceGouvernance?.map((item) => item.id)).toEqual([
      instanceTag.id,
    ]);
    expect(dup.indicateurs?.map((item) => item.id)).toEqual([indicateurId]);
    expect(dup.tempsDeMiseEnOeuvre?.id).toBe(temps.id);
    expect(
      dup.financeurs?.map((item) => ({
        id: item.financeurTagId,
        montant: item.montantTtc,
      }))
    ).toEqual([{ id: financeurTag.id, montant: 12345 }]);

    const newPlan = await caller.plans.plans.get({ planId: duplicated.planId });
    const newAxeId = newPlan.axes.find(
      (item) => item.nom === 'Axe exhaustif'
    )?.id;
    expect(dup.axes?.map((item) => item.id)).toEqual([newAxeId]);
    expect(dup.axes?.map((item) => item.id)).not.toContain(axe.id);

    const dupBudgets = (dup.budgets ?? []).map((budget) => ({
      type: budget.type,
      unite: budget.unite,
      annee: budget.annee ?? null,
      budgetPrevisionnel: budget.budgetPrevisionnel ?? null,
      budgetReel: budget.budgetReel ?? null,
      estEtale: budget.estEtale,
    }));
    expect(dupBudgets).toHaveLength(2);
    expect(dupBudgets).toEqual(
      expect.arrayContaining([
        {
          type: 'investissement',
          unite: 'HT',
          annee: 2026,
          budgetPrevisionnel: 50000,
          budgetReel: 12000,
          estEtale: false,
        },
        {
          type: 'fonctionnement',
          unite: 'ETP',
          annee: 2026,
          budgetPrevisionnel: 2,
          budgetReel: null,
          estEtale: false,
        },
      ])
    );

    expect(dup.fichesLiees ?? []).toEqual([]);
    expect(dup.docs ?? []).toEqual([]);
    expect(dup.etapes ?? []).toEqual([]);
    expect(dup.sharedWithCollectivites ?? []).toEqual([]);
  });

  test('refuse la duplication à un utilisateur sans droit sur la collectivité', async () => {
    const caller = buildEditorCaller();
    const sourcePlan = await caller.plans.plans.create({
      nom: 'Plan protégé',
      collectiviteId: collectivite.id,
    });
    cleanupPlans([sourcePlan.id]);

    const unauthorizedCaller = router.createCaller({ user: noAccessUser });

    await expect(
      unauthorizedCaller.plans.plans.duplicate({ planId: sourcePlan.id })
    ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
  });

  test('refuse la duplication inter-collectivités (IDOR) et ne crée rien', async () => {
    const caller = buildEditorCaller();
    const sourcePlan = await caller.plans.plans.create({
      nom: 'Plan collectivité A',
      collectiviteId: collectivite.id,
    });
    cleanupPlans([sourcePlan.id]);

    const otherResult = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    const otherUser = getAuthUserFromUserCredentials(otherResult.user);
    const otherCaller = router.createCaller({ user: otherUser });

    const plansBefore = await otherCaller.plans.plans.list({
      collectiviteId: otherResult.collectivite.id,
    });

    await expect(
      otherCaller.plans.plans.duplicate({ planId: sourcePlan.id })
    ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");

    const plansAfter = await otherCaller.plans.plans.list({
      collectiviteId: otherResult.collectivite.id,
    });
    expect(plansAfter.plans.length).toBe(plansBefore.plans.length);
  });

  test('renvoie une erreur quand le plan source est introuvable', async () => {
    const caller = buildEditorCaller();

    await expect(
      caller.plans.plans.duplicate({ planId: 999999 })
    ).rejects.toThrow("Le plan à dupliquer n'a pas été trouvé");
  });
});
