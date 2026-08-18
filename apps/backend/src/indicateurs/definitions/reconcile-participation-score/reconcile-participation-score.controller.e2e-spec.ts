import { INestApplication } from '@nestjs/common';
import { actionDefinitionTable } from '@tet/backend/referentiels/models/action-definition.table';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { indicateurActionTable } from '../indicateur-action.table';
import { indicateurDefinitionTable } from '../indicateur-definition.table';

describe('reconcile-participation-score.controller.e2e-spec', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    databaseService = await getTestDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  async function createIndicateur(
    identifiantReferentiel: string,
    participationScore: boolean
  ) {
    const [indicateur] = await databaseService.db
      .insert(indicateurDefinitionTable)
      .values({
        identifiantReferentiel,
        titre: identifiantReferentiel,
        unite: 'unité',
        participationScore,
      })
      .returning();

    onTestFinished(async () => {
      await databaseService.db
        .delete(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, indicateur.id));
    });

    return indicateur;
  }

  // Positionne temporairement l'exprScore d'une action déjà seedée (sans
  // formule) pour qu'elle référence l'indicateur donné — seule source de
  // vérité prise en compte par la réconciliation. Restauré après le test.
  async function linkViaExprScore(
    actionId: string,
    identifiantIndicateur: string
  ) {
    const [before] = await databaseService.db
      .select({ exprScore: actionDefinitionTable.exprScore })
      .from(actionDefinitionTable)
      .where(eq(actionDefinitionTable.actionId, actionId));

    await databaseService.db
      .update(actionDefinitionTable)
      .set({ exprScore: `val(${identifiantIndicateur})` })
      .where(eq(actionDefinitionTable.actionId, actionId));

    onTestFinished(async () => {
      await databaseService.db
        .update(actionDefinitionTable)
        .set({ exprScore: before.exprScore })
        .where(eq(actionDefinitionTable.actionId, actionId));
    });
  }

  // Lien via la colonne `Indicateurs` (table indicateur_action) uniquement —
  // ne doit PAS suffire à activer participationScore.
  async function linkViaIndicateurAction(indicateurId: number) {
    await databaseService.db
      .insert(indicateurActionTable)
      .values({ indicateurId, actionId: 'cae_1.1.2.2.3' });
    onTestFinished(async () => {
      await databaseService.db
        .delete(indicateurActionTable)
        .where(eq(indicateurActionTable.indicateurId, indicateurId));
    });
  }

  async function getParticipationScore(indicateurId: number) {
    const [row] = await databaseService.db
      .select({
        participationScore: indicateurDefinitionTable.participationScore,
      })
      .from(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.id, indicateurId));
    return row.participationScore;
  }

  test('seule une référence exprScore est la source de vérité, dans les deux sens', async () => {
    const sansReference = await createIndicateur(
      `test_reconcile_sans_reference_${Date.now()}`,
      true
    );
    const avecReference = await createIndicateur(
      `test_reconcile_avec_reference_${Date.now()}`,
      true
    );
    const nouvelleReference = await createIndicateur(
      `test_reconcile_nouvelle_reference_${Date.now()}`,
      false
    );
    const seulementColonneIndicateurs = await createIndicateur(
      `test_reconcile_colonne_indicateurs_${Date.now()}`,
      true
    );

    assert(avecReference.identifiantReferentiel);
    assert(nouvelleReference.identifiantReferentiel);
    await linkViaExprScore(
      'cae_1.1.2.2.1',
      avecReference.identifiantReferentiel
    );
    await linkViaExprScore(
      'cae_1.1.2.2.2',
      nouvelleReference.identifiantReferentiel
    );
    // Lien via la colonne `Indicateurs` seule — ne doit pas suffire
    await linkViaIndicateurAction(seulementColonneIndicateurs.id);

    const response = await request(app.getHttpServer())
      .get('/indicateurs/definitions/reconcile-participation-score')
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(200);

    expect(response.body.disabledIdentifiants).toContain(
      sansReference.identifiantReferentiel
    );
    expect(response.body.disabledIdentifiants).not.toContain(
      avecReference.identifiantReferentiel
    );
    expect(response.body.enabledIdentifiants).toContain(
      nouvelleReference.identifiantReferentiel
    );
    expect(response.body.disabledIdentifiants).toContain(
      seulementColonneIndicateurs.identifiantReferentiel
    );

    expect(await getParticipationScore(sansReference.id)).toBe(false);
    expect(await getParticipationScore(avecReference.id)).toBe(true);
    expect(await getParticipationScore(nouvelleReference.id)).toBe(true);
    expect(await getParticipationScore(seulementColonneIndicateurs.id)).toBe(
      false
    );
  });
});
