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
import {
  MERGE_COMMENTAIRES_PREFIX,
  mergeCommentaires,
} from './merge-commentaires.rules';

/**
 * Exemples figés depuis `import-referentiel/samples/referentiel-te-structure.csv`.
 * À mettre à jour si le CSV TE change
 */
const MERGE_COMMENTAIRES_FIXTURE = {
  /** TE 1.1.1.2 ← Cae_1.1.2.2.1 (correspondance 1→1) */
  teActionCae1to1: {
    teActionId: 'te_1.1.1.2',
    caeOrigineActionId: 'cae_1.1.2.2.1',
  },
  /** TE 5.1.2.3 ← Cae_5.1.2.3 + Eci_1.1.3.3 (fusion 2→1) */
  teActionCaeAndEci: {
    teActionId: 'te_5.1.2.3',
    caeOrigineActionId: 'cae_5.1.2.3',
    eciOrigineActionId: 'eci_1.1.3.3',
  },
  /** TE 1.1.1.3 : origine « Nouvelle action », sans source CAE/ECI */
  teNativeActionId: 'te_1.1.1.3',
} as const;

describe('mergeCommentaires', () => {
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

  async function setActionCommentaire(actionId: string, commentaire: string) {
    const caller = router.createCaller({ user });
    await caller.referentiels.actions.updateCommentaire({
      collectiviteId: collectivite.id,
      actionId,
      commentaire,
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
    return mergeCommentaires(ctxResult.data);
  }

  test('CAE seul, 1→1 avec explication : commentaire fusionné (préfixe + bloc source)', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const { teActionId, caeOrigineActionId } =
      MERGE_COMMENTAIRES_FIXTURE.teActionCae1to1;
    const sourceCommentaire =
      '<p>Explication CAE figée au moment T pour la bascule TE.</p>';

    await setActionStatut(caeOrigineActionId, StatutAvancementEnum.FAIT);
    await setActionCommentaire(caeOrigineActionId, sourceCommentaire);

    const data = await mergeFromPrefs(prefsEligibleCaeOnly);

    const teCommentaire = data.find(
      (commentaire) => commentaire.actionId === teActionId
    );

    expect(teCommentaire?.commentaire.startsWith(MERGE_COMMENTAIRES_PREFIX)).toBe(
      true
    );
    expect(teCommentaire?.commentaire).toContain(caeOrigineActionId);
    expect(teCommentaire?.commentaire).toContain('FAIT');
    expect(teCommentaire?.commentaire).toContain(sourceCommentaire);
  });

  test('CAE + ECI write, fusion N→1 : deux blocs ordonnés CAE puis ECI', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const { teActionId, caeOrigineActionId, eciOrigineActionId } =
      MERGE_COMMENTAIRES_FIXTURE.teActionCaeAndEci;

    await setActionStatut(caeOrigineActionId, StatutAvancementEnum.FAIT);
    await setActionStatut(eciOrigineActionId, StatutAvancementEnum.PAS_FAIT);
    await setActionCommentaire(
      caeOrigineActionId,
      '<p>Bloc CAE pour fusion commentaires.</p>'
    );
    await setActionCommentaire(
      eciOrigineActionId,
      'Bloc ECI en texte brut pour fusion commentaires.'
    );

    const data = await mergeFromPrefs(prefsEligibleCaeAndEci);

    const teCommentaire = data.find(
      (commentaire) => commentaire.actionId === teActionId
    );
    const commentaire = teCommentaire?.commentaire ?? '';

    expect(commentaire.indexOf(caeOrigineActionId)).toBeLessThan(
      commentaire.indexOf(eciOrigineActionId)
    );
    expect(commentaire).toContain('Bloc CAE pour fusion commentaires.');
    expect(commentaire).toContain('Bloc ECI en texte brut pour fusion commentaires.');
  });

  test('source non concerne ignorée : commentaire TE basé sur la source restante', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const { teActionId, caeOrigineActionId, eciOrigineActionId } =
      MERGE_COMMENTAIRES_FIXTURE.teActionCaeAndEci;

    await setActionStatut(caeOrigineActionId, StatutAvancementEnum.FAIT);
    await setActionStatut(eciOrigineActionId, 'non_concerne');
    await setActionCommentaire(
      caeOrigineActionId,
      '<p>Seule explication CAE conservée.</p>'
    );
    await setActionCommentaire(
      eciOrigineActionId,
      '<p>Explication ECI ignorée car non concerne.</p>'
    );

    const data = await mergeFromPrefs(prefsEligibleCaeAndEci);

    const teCommentaire = data.find(
      (commentaire) => commentaire.actionId === teActionId
    );

    expect(teCommentaire?.commentaire).toContain(caeOrigineActionId);
    expect(teCommentaire?.commentaire).not.toContain(eciOrigineActionId);
  });

  test('source concernée sans texte : pas de commentaire TE', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const { teActionId, caeOrigineActionId } =
      MERGE_COMMENTAIRES_FIXTURE.teActionCae1to1;

    await setActionStatut(caeOrigineActionId, StatutAvancementEnum.FAIT);

    const data = await mergeFromPrefs(prefsEligibleCaeOnly);

    expect(
      data.some((commentaire) => commentaire.actionId === teActionId)
    ).toBe(false);
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

  test('action TE native absente du résultat', async () => {
    onTestFinished(cleanupCollectiviteReferentielData);
    await setupTest();

    const data = await mergeFromPrefs(prefsEligibleCaeOnly);

    expect(
      data.some(
        (commentaire) =>
          commentaire.actionId === MERGE_COMMENTAIRES_FIXTURE.teNativeActionId
      )
    ).toBe(false);
  });
});
