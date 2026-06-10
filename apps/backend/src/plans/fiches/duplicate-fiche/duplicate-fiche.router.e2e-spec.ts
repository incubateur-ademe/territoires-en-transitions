import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { uploadCreateTestDocument } from '@tet/backend/collectivites/documents/documents.test-fixture';
import { createIndicateurPerso } from '@tet/backend/indicateurs/definitions/definitions.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  signInWith,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { Collectivite, TagEnum, TagType } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import request from 'supertest';
import { onTestFinished } from 'vitest';

describe('Dupliquer une fiche action', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  let collectivite: Collectivite;
  let editorUser: AuthenticatedUser;
  let fichierId: number;

  beforeAll(async () => {
    app = await getTestApp();
    router = await app.get(TrpcRouter);
    db = await getTestDatabase(app);

    const result = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectivite = result.collectivite;
    editorUser = getAuthUserFromUserCredentials(result.user);

    const signIn = await signInWith({
      email: result.user.email,
      password: result.user.password,
    });
    const token = signIn.data.session?.access_token ?? '';
    if (!token) {
      throw new Error('token éditeur manquant');
    }
    const doc = await uploadCreateTestDocument({
      collectiviteId: collectivite.id,
      testAgent: request(app.getHttpServer()),
      token,
      fileName: 'preuve-fiche.pdf',
    });
    fichierId = doc.id;
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

  test('duplique exhaustivement une fiche (champs, relations, budgets, annexes, notes) et ses sous-actions', async () => {
    const caller = buildEditorCaller();

    const createTag = (tagType: TagType, nom: string) =>
      caller.collectivites.tags.create({
        tagType,
        nom,
        collectiviteId: collectivite.id,
      });

    const piloteTag = await createTag(TagEnum.Personne, 'Pilote fiche');
    const referentTag = await createTag(TagEnum.Personne, 'Référent fiche');
    const serviceTag = await createTag(TagEnum.Service, 'Service fiche');
    const structureTag = await createTag(TagEnum.Structure, 'Structure fiche');
    const partenaireTag = await createTag(TagEnum.Partenaire, 'Partenaire fiche');
    const libreTag = await createTag(TagEnum.Libre, 'Tag libre fiche');
    const instanceTag = await createTag(
      TagEnum.InstanceGouvernance,
      'Instance fiche'
    );
    const financeurTag = await createTag(TagEnum.Financeur, 'Financeur fiche');

    const [thematique] = await caller.shared.thematiques.list();
    const [sousThematique] =
      await caller.shared.thematiques.listSousThematiques();
    const [effetAttendu] = await caller.shared.effetsAttendus.list();
    const [temps] = await caller.shared.tempsDeMiseEnOeuvre.list();

    const indicateurId = await createIndicateurPerso({
      caller,
      indicateurData: {
        collectiviteId: collectivite.id,
        titre: 'Indicateur fiche',
        unite: 'kg',
      },
    });

    const plan = await caller.plans.plans.create({
      nom: 'Plan',
      collectiviteId: collectivite.id,
    });
    const axe = await caller.plans.axes.create({
      nom: 'Axe',
      collectiviteId: collectivite.id,
      planId: plan.id,
      parent: plan.id,
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
    await caller.plans.fiches.addAnnexe({
      ficheId: sourceFiche.id,
      commentaire: 'Preuve fichier',
      fichierId,
    });
    await caller.plans.fiches.addAnnexe({
      ficheId: sourceFiche.id,
      commentaire: 'Preuve lien',
      lien: { url: 'https://example.org/preuve', titre: 'Lien preuve' },
    });
    await caller.plans.fiches.update({
      ficheId: sourceFiche.id,
      ficheFields: {
        notes: [{ dateNote: '2024-01-15', note: 'Une note' }],
        tempsDeMiseEnOeuvre: { id: temps.id },
      },
    });
    await caller.plans.fiches.create({
      fiche: {
        collectiviteId: collectivite.id,
        titre: 'Sous-action',
        description: 'Description sous-action',
        parentId: sourceFiche.id,
      },
    });

    const { ficheId: newFicheId } = await caller.plans.fiches.duplicate({
      ficheId: sourceFiche.id,
    });
    cleanupPlans([plan.id]);
    expect(newFicheId).not.toBe(sourceFiche.id);

    const { data: planFiches } = await caller.plans.fiches.listFiches({
      collectiviteId: collectivite.id,
      filters: { planActionIds: [plan.id] },
      queryOptions: { limit: 'all' },
    });
    const duplicatedFiche = planFiches.find((fiche) => fiche.id === newFicheId);
    if (!duplicatedFiche) {
      throw new Error('fiche dupliquée introuvable');
    }
    expect(duplicatedFiche).toMatchObject({
      titre: 'Fiche exhaustive (copie)',
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
    expect(duplicatedFiche.cibles).toEqual(['Grand public', 'Associations']);
    expect(duplicatedFiche.piliersEci).toEqual(['Recyclage', 'Écoconception']);
    expect(duplicatedFiche.dateDebut).toContain('2026-01-15');
    expect(duplicatedFiche.dateFin).toContain('2026-12-15');

    expect(duplicatedFiche.axes?.map((item) => item.id)).toEqual([axe.id]);
    expect(duplicatedFiche.thematiques?.map((item) => item.id)).toEqual([thematique.id]);
    expect(duplicatedFiche.sousThematiques?.map((item) => item.id)).toEqual([
      sousThematique.id,
    ]);
    expect(duplicatedFiche.effetsAttendus?.map((item) => item.id)).toEqual([
      effetAttendu.id,
    ]);
    expect(duplicatedFiche.partenaires?.map((item) => item.id)).toEqual([partenaireTag.id]);
    expect(duplicatedFiche.structures?.map((item) => item.id)).toEqual([structureTag.id]);
    expect(duplicatedFiche.services?.map((item) => item.id)).toEqual([serviceTag.id]);
    expect(duplicatedFiche.pilotes?.map((item) => item.tagId)).toEqual([piloteTag.id]);
    expect(duplicatedFiche.referents?.map((item) => item.tagId)).toEqual([referentTag.id]);
    expect(duplicatedFiche.libreTags?.map((item) => item.id)).toEqual([libreTag.id]);
    expect(duplicatedFiche.instanceGouvernance?.map((item) => item.id)).toEqual([
      instanceTag.id,
    ]);
    expect(duplicatedFiche.indicateurs?.map((item) => item.id)).toEqual([indicateurId]);
    expect(duplicatedFiche.tempsDeMiseEnOeuvre?.id).toBe(temps.id);
    expect(
      duplicatedFiche.financeurs?.map((item) => ({
        id: item.financeurTagId,
        montant: item.montantTtc,
      }))
    ).toEqual([{ id: financeurTag.id, montant: 12345 }]);

    const duplicatedBudgets = (duplicatedFiche.budgets ?? []).map((budget) => ({
      type: budget.type,
      unite: budget.unite,
      annee: budget.annee ?? null,
      budgetPrevisionnel: budget.budgetPrevisionnel ?? null,
      budgetReel: budget.budgetReel ?? null,
      estEtale: budget.estEtale,
    }));
    expect(duplicatedBudgets).toHaveLength(2);
    expect(duplicatedBudgets).toEqual(
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

    expect(duplicatedFiche.notes).toHaveLength(1);
    expect(duplicatedFiche.notes).toContainEqual(
      expect.objectContaining({ dateNote: '2024-01-15', note: 'Une note' })
    );

    const annexes = await caller.plans.fiches.ficheAnnexes({
      collectiviteId: collectivite.id,
      ficheIds: [newFicheId],
    });
    expect(annexes.length).toBe(2);
    const fichierAnnexe = annexes.find((annexe) => annexe.fichier !== null);
    const lienAnnexe = annexes.find((annexe) => annexe.lien !== null);
    expect(fichierAnnexe?.fichier?.filename).toBe('preuve-fiche.pdf');
    expect(fichierAnnexe?.commentaire).toBe('Preuve fichier');
    expect(lienAnnexe?.lien?.url).toBe('https://example.org/preuve');
    expect(lienAnnexe?.commentaire).toBe('Preuve lien');

    expect(duplicatedFiche.fichesLiees ?? []).toEqual([]);
    expect(duplicatedFiche.etapes ?? []).toEqual([]);
    expect(duplicatedFiche.sharedWithCollectivites ?? []).toEqual([]);

    const { data: newSousActions } = await caller.plans.fiches.listFiches({
      collectiviteId: collectivite.id,
      filters: { parentsId: [newFicheId] },
      queryOptions: { limit: 'all' },
    });
    expect(newSousActions.length).toBe(1);
    expect(newSousActions[0].titre).toBe('Sous-action');
    expect(newSousActions[0].description).toBe('Description sous-action');
    expect(newSousActions[0].parentId).toBe(newFicheId);
  });

  test('refuse la duplication inter-collectivités (IDOR)', async () => {
    const caller = buildEditorCaller();
    const plan = await caller.plans.plans.create({
      nom: 'Plan A',
      collectiviteId: collectivite.id,
    });
    const source = await caller.plans.fiches.create({
      fiche: { collectiviteId: collectivite.id, titre: 'Action A' },
      ficheFields: { axes: [{ id: plan.id }] },
    });
    cleanupPlans([plan.id]);

    const otherResult = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
    });
    const otherCaller = router.createCaller({
      user: getAuthUserFromUserCredentials(otherResult.user),
    });

    await expect(
      otherCaller.plans.fiches.duplicate({ ficheId: source.id })
    ).rejects.toThrow("Vous n'avez pas les permissions nécessaires");
  });

  test('renvoie une erreur quand la fiche est introuvable', async () => {
    await expect(
      buildEditorCaller().plans.fiches.duplicate({ ficheId: 999999 })
    ).rejects.toThrow("La fiche à dupliquer n'a pas été trouvée");
  });
});
