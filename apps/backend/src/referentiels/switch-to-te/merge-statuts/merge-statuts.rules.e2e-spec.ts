import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import {
  type Collectivite,
  type CollectiviteReferentielPreferences,
} from '@tet/domain/collectivites';
import {
  ActionTypeEnum,
  flatMapActionsEnfants,
  StatutAvancementEnum,
  type ScoreSnapshot,
} from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { BuildSwitchToTeContextService } from '../build-switch-to-te-context.service';
import { CreatePreSwitchSnapshotsService } from '../create-pre-switch-snapshots.service';
import {
  buildSwitchToTeContextForTest,
  cleanupSwitchToTeCollectiviteData,
  prefsEligibleCaeAndEci,
  prefsEligibleCaeOnly,
} from '../switch-to-te-context.test-fixture';
import { SwitchToTeErrorEnum } from '../switch-to-te.errors';
import { mergeStatuts } from './merge-statuts.rules';

/**
 * Exemples figés depuis `import-referentiel/samples/referentiel-te-structure.csv`.
 * À mettre à jour si le CSV TE change
 */
const MERGE_STATUTS_FIXTURE = {
  /** TE 1.1.1.2 ← Cae_1.1.2.2.1 (correspondance 1→1) */
  teActionCae1to1: {
    teActionId: 'te_1.1.1.2',
    caeOrigineActionId: 'cae_1.1.2.2.1',
  },
  /** TE 5.1.2.4 ← Cae_5.1.2.3 + Eci_1.1.3.3 (fusion 2→1, pondération 1 chacune) */
  teActionCaeAndEci: {
    teActionId: 'te_5.1.2.4',
    caeOrigineActionId: 'cae_5.1.2.3',
    eciOrigineActionId: 'eci_1.1.3.3',
  },
  /** TE 1.1.1.3 : origine « Nouvelle action », sans source CAE/ECI */
  teNativeActionId: 'te_1.1.1.3',
} as const;

describe('mergeStatuts', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let router: TrpcRouter;
  let buildSwitchToTeContextService: BuildSwitchToTeContextService;
  let createPreSwitchSnapshotsService: CreatePreSwitchSnapshotsService;
  let collectivite: Collectivite;
  let user: AuthenticatedUser;
  let cleanupFixture: () => Promise<void>;

  beforeAll(async () => {
    app = await getTestApp();
    databaseService = await getTestDatabase(app);
    router = await getTestRouter(app);
    buildSwitchToTeContextService = app.get(BuildSwitchToTeContextService);
    createPreSwitchSnapshotsService = app.get(CreatePreSwitchSnapshotsService);

    const fixture = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    collectivite = fixture.collectivite;
    cleanupFixture = fixture.cleanup;
    user = getAuthUserFromUserCredentials(fixture.user);
  });

  afterAll(async () => {
    await cleanupFixture();
    await app.close();
  });

  async function cleanupCollectiviteReferentielData() {
    await cleanupSwitchToTeCollectiviteData(databaseService, collectivite.id);
  }

  async function setupTest() {
    await cleanupCollectiviteReferentielData();
  }

  async function setActionStatut(
    actionId: string,
    statut: 'fait' | 'pas_fait' | 'non_concerne'
  ) {
    const caller = router.createCaller({ user });
    await caller.referentiels.actions.updateStatuts({
      actionStatuts: [
        {
          collectiviteId: collectivite.id,
          actionId,
          statut,
        },
      ],
    });
  }

  async function setActionStatutDetaille(
    actionId: string,
    statutDetailleAuPourcentage: [number, number, number]
  ) {
    const caller = router.createCaller({ user });
    await caller.referentiels.actions.updateStatuts({
      actionStatuts: [
        {
          collectiviteId: collectivite.id,
          actionId,
          statut: StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
          statutDetailleAuPourcentage,
        },
      ],
    });
  }

  async function buildCtx(
    prefs: CollectiviteReferentielPreferences,
    preSwitchSnapshots?: ScoreSnapshot[]
  ) {
    return buildSwitchToTeContextForTest(
      collectivite.id,
      prefs,
      {
        createPreSwitchSnapshotsService,
        buildSwitchToTeContextService,
      },
      { user, preSwitchSnapshots }
    );
  }

  async function mergeFromPrefs(
    prefs: CollectiviteReferentielPreferences,
    preSwitchSnapshots?: ScoreSnapshot[]
  ) {
    const ctxResult = await buildCtx(prefs, preSwitchSnapshots);
    expect(ctxResult.success).toBe(true);
    if (!ctxResult.success) {
      throw new Error('buildSwitchToTeContext a échoué');
    }
    return mergeStatuts(ctxResult.data);
  }

  test('CAE seul, 1→1 fait : TE reçoit fait sur la sous-action cible', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const { teActionId, caeOrigineActionId } =
      MERGE_STATUTS_FIXTURE.teActionCae1to1;

    await setActionStatut(caeOrigineActionId, StatutAvancementEnum.FAIT);
    const data = await mergeFromPrefs(prefsEligibleCaeOnly);

    const teStatut = data.find((statut) => statut.actionId === teActionId);
    expect(teStatut?.statut).toBe(StatutAvancementEnum.FAIT);
  });

  test('CAE + ECI write, fusion N→1 : statut TE cohérent avec projection pondérée', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const { teActionId, caeOrigineActionId, eciOrigineActionId } =
      MERGE_STATUTS_FIXTURE.teActionCaeAndEci;

    await setActionStatut(caeOrigineActionId, StatutAvancementEnum.FAIT);
    await setActionStatut(eciOrigineActionId, StatutAvancementEnum.PAS_FAIT);
    const data = await mergeFromPrefs(prefsEligibleCaeAndEci);

    const teStatut = data.find((statut) => statut.actionId === teActionId);
    expect(teStatut).toEqual({
      collectiviteId: collectivite.id,
      actionId: teActionId,
      statut: StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
      statutDetailleAuPourcentage: [0.35, 0, 0.65],
    });
  });

  test('toutes sources non concerne : TE reçoit NON_CONCERNE', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const { teActionId, caeOrigineActionId, eciOrigineActionId } =
      MERGE_STATUTS_FIXTURE.teActionCaeAndEci;

    await setActionStatut(caeOrigineActionId, 'non_concerne');
    await setActionStatut(eciOrigineActionId, 'non_concerne');
    const data = await mergeFromPrefs(prefsEligibleCaeAndEci);

    const teStatut = data.find((statut) => statut.actionId === teActionId);
    expect(teStatut?.statut).toBe(StatutAvancementEnum.NON_CONCERNE);
  });

  test('CAE seul, fusion N→1 : origine ECI archivée ignorée, TE = statut CAE', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const { teActionId, caeOrigineActionId } =
      MERGE_STATUTS_FIXTURE.teActionCaeAndEci;

    await setActionStatut(caeOrigineActionId, StatutAvancementEnum.FAIT);
    const data = await mergeFromPrefs(prefsEligibleCaeOnly);

    const teStatut = data.find((statut) => statut.actionId === teActionId);
    expect(teStatut?.statut).toBe(StatutAvancementEnum.FAIT);
  });

  test('source non concerne ignorée : TE = statut de la source restante', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const { teActionId, caeOrigineActionId, eciOrigineActionId } =
      MERGE_STATUTS_FIXTURE.teActionCaeAndEci;

    await setActionStatut(caeOrigineActionId, StatutAvancementEnum.FAIT);
    await setActionStatut(eciOrigineActionId, 'non_concerne');
    const data = await mergeFromPrefs(prefsEligibleCaeAndEci);

    const teStatut = data.find((statut) => statut.actionId === teActionId);

    // 1 fait + 1 non_concerne → équivalent 1→1 sur la source restante (PRD bascule TE)
    expect(teStatut?.statut).toBe(StatutAvancementEnum.FAIT);
  });

  test('source concernée sans avancement : TE reçoit NON_RENSEIGNE', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const { teActionId } = MERGE_STATUTS_FIXTURE.teActionCae1to1;

    const data = await mergeFromPrefs(prefsEligibleCaeOnly);

    const teStatut = data.find((statut) => statut.actionId === teActionId);
    expect(teStatut?.statut).toBe(StatutAvancementEnum.NON_RENSEIGNE);
  });

  test('1→1 detaille au % : projection + arrondi inférieur 5 % (74 % → 70 %)', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const { teActionId, caeOrigineActionId } =
      MERGE_STATUTS_FIXTURE.teActionCae1to1;

    await setActionStatutDetaille(caeOrigineActionId, [0.74, 0, 0.26]);

    const data = await mergeFromPrefs(prefsEligibleCaeOnly);

    const teStatut = data.find((statut) => statut.actionId === teActionId);
    expect(teStatut).toEqual({
      collectiviteId: collectivite.id,
      actionId: teActionId,
      statut: StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
      statutDetailleAuPourcentage: [0.7, 0, 0.3],
    });
  });

  test('action TE non concernée (personnalisation) : NON_CONCERNE malgré sources CAE concernées', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const { teActionId, caeOrigineActionId } =
      MERGE_STATUTS_FIXTURE.teActionCae1to1;

    await setActionStatut(caeOrigineActionId, StatutAvancementEnum.FAIT);

    const caller = router.createCaller({ user });
    await caller.collectivites.personnalisations.setReponse({
      collectiviteId: collectivite.id,
      questionId: 'PCAET_1',
      reponse: false,
    });

    const data = await mergeFromPrefs(prefsEligibleCaeOnly);

    const teStatut = data.find((statut) => statut.actionId === teActionId);
    expect(teStatut?.statut).toBe(StatutAvancementEnum.NON_CONCERNE);
  });

  test('sans pre-switch-te : failure PRE_SWITCH_SNAPSHOT_MISSING', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const result = await buildCtx(prefsEligibleCaeOnly, []);

    expect(result).toEqual({
      success: false,
      error: SwitchToTeErrorEnum.PRE_SWITCH_SNAPSHOT_MISSING,
    });
  });

  test('action TE native (sans origine) absente du résultat', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const data = await mergeFromPrefs(prefsEligibleCaeOnly);

    expect(
      data.some(
        (statut) => statut.actionId === MERGE_STATUTS_FIXTURE.teNativeActionId
      )
    ).toBe(false);
  });

  // détecte dans l'arbre TE courant une sous-mesure porteuse de
  // tâches ; à réviser si la structure du CSV TE change (cf. MERGE_STATUTS_FIXTURE).
  test('sous-mesure TE porteuse de tâches : pas de reprise de statut sur le parent concerné', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const ctxResult = await buildCtx(prefsEligibleCaeAndEci);
    expect(ctxResult.success).toBe(true);
    if (!ctxResult.success) {
      throw new Error('buildSwitchToTeContext a échoué');
    }
    const ctx = ctxResult.data;
    const noeuds = flatMapActionsEnfants(ctx.referentielTe.itemsTree);

    const parentAvecTaches = noeuds.find(
      (noeud) =>
        noeud.actionType === ActionTypeEnum.SOUS_ACTION &&
        (noeud.actionsOrigine?.length ?? 0) > 0 &&
        (noeud.actionsEnfant ?? []).some(
          (enfant) => enfant.actionType === ActionTypeEnum.TACHE
        )
    );

    if (!parentAvecTaches) {
      console.warn(
        'mergeStatuts e2e : aucune sous-mesure TE avec tâches + origine dans le CSV courant, assertion ignorée'
      );
      return;
    }

    const data = mergeStatuts(ctx);

    expect(
      data.some((statut) => statut.actionId === parentAvecTaches.actionId)
    ).toBe(false);

    // non-régression : une sous-mesure feuille avec origine reçoit toujours un statut
    const feuilleAvecOrigine = noeuds.find(
      (noeud) =>
        noeud.actionType === ActionTypeEnum.SOUS_ACTION &&
        (noeud.actionsOrigine?.length ?? 0) > 0 &&
        (noeud.actionsEnfant ?? []).every(
          (enfant) => enfant.actionType !== ActionTypeEnum.TACHE
        )
    );
    if (feuilleAvecOrigine) {
      expect(
        data.some((statut) => statut.actionId === feuilleAvecOrigine.actionId)
      ).toBe(true);
    }
  });
});
