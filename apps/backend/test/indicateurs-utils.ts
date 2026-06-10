import { indicateurActionTable } from '@tet/backend/indicateurs/definitions/indicateur-action.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import { actionDefinitionTable } from '@tet/backend/referentiels/models/action-definition.table';
import { actionScoreIndicateurValeurTable } from '@tet/backend/referentiels/models/action-score-indicateur-valeur.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { and, eq, inArray } from 'drizzle-orm';

export const getIndicateurIdByIdentifiant = async (
  databaseService: DatabaseService,
  identifiant: string
): Promise<number> => {
  const result = await databaseService.db
    .select({
      id: indicateurDefinitionTable.id,
    })
    .from(indicateurDefinitionTable)
    .where(eq(indicateurDefinitionTable.identifiantReferentiel, identifiant));
  if (result.length === 0) {
    throw new Error(`Indicateur with identifiant ${identifiant} not found`);
  }
  return result[0].id;
};

export const deleteIndicateurValeursForCollectivite = async (
  databaseService: DatabaseService,
  collectiviteId: number,
  indicateurIds: number[]
): Promise<void> => {
  await databaseService.db
    .delete(indicateurValeurTable)
    .where(
      and(
        eq(indicateurValeurTable.collectiviteId, collectiviteId),
        inArray(indicateurValeurTable.indicateurId, indicateurIds)
      )
    );
};

export const fixturePourScoreIndicatif = {
  collectiviteId: 1,
  actionId: 'cae_1.2.3.3.4',
  identifiantReferentiel: 'cae_7',
  dateValeur: '2025-05-29',
  exprScore: `si val(cae_7) < limite(cae_7) alors 0
  sinon si val(cae_7) > cible(cae_7) alors 1
  sinon ((val(cae_7) - limite(cae_7)) * 0.05) / (limite(cae_7) - cible(cae_7))`,
  objectif: 44, // objectif collectivité < limite (45),
  resultat: 63, // résultat citepa < cible (65)
};

type ScoreIndicatifValeursInput = {
  indicateurId: number;
  collectiviteId: number;
  dateValeur: string;
  objectif: number;
  resultat: number;
};

// met à jour exprScore et lie l'indicateur à l'action
async function prepareActionPourScoreIndicatif(
  databaseService: DatabaseService,
  {
    actionId,
    indicateurId,
    exprScore,
  }: {
    actionId: string;
    indicateurId: number;
    exprScore: string;
  }
) {
  // la formule n'est pas dans les données de seed
  await databaseService.db
    .update(actionDefinitionTable)
    .set({ exprScore })
    .where(eq(actionDefinitionTable.actionId, actionId));

  // ni le lien entre l'action et l'indicateur
  await databaseService.db
    .insert(indicateurActionTable)
    .values([{ indicateurId, actionId }])
    .onConflictDoNothing();
}

// insère la paire objectif/résultat (metadonneeId null / 1)
async function insertIndicateursValeurs(
  databaseService: DatabaseService,
  {
    indicateurId,
    collectiviteId,
    dateValeur,
    objectif,
    resultat,
    // contrôle le périmètre du DELETE des valeurs avant l'INSERT
    // si true efface les valeurs pour indicateurId+collectiviteId uniquement à
    // dateValeur sinon efface pour toutes les dates
    deleteByDate,
  }: ScoreIndicatifValeursInput & { deleteByDate: boolean }
) {
  const deleteConditions = [
    eq(indicateurValeurTable.indicateurId, indicateurId),
    eq(indicateurValeurTable.collectiviteId, collectiviteId),
    ...(deleteByDate ? [eq(indicateurValeurTable.dateValeur, dateValeur)] : []),
  ];

  // supprime les valeurs existantes pour rendre la fixture idempotente
  await databaseService.db
    .delete(indicateurValeurTable)
    .where(and(...deleteConditions));

  return databaseService.db
    .insert(indicateurValeurTable)
    .values([
      {
        indicateurId,
        collectiviteId,
        dateValeur,
        metadonneeId: null,
        resultat: null,
        objectif,
      },
      {
        indicateurId,
        collectiviteId,
        dateValeur,
        metadonneeId: 1,
        resultat,
        objectif: null,
      },
    ])
    .returning();
}

// associe les valeurs programme/fait à l'action (pour la collectivité) pour le
// calcul du score indicatif
async function insertActionScoreIndicateurValeurs(
  databaseService: DatabaseService,
  {
    actionId,
    collectiviteId,
    indicateurId,
    valeurs,
  }: {
    actionId: string;
    collectiviteId: number;
    indicateurId: number;
    valeurs: { id: number; metadonneeId: number | null }[];
  }
) {
  const programmeValeur = valeurs.find((v) => v.metadonneeId === null);
  const faitValeur = valeurs.find((v) => v.metadonneeId === 1);
  if (!programmeValeur || !faitValeur) {
    throw new Error('Valeurs programme/fait introuvables pour la fixture');
  }

  await databaseService.db
    .insert(actionScoreIndicateurValeurTable)
    .values([
      {
        actionId,
        collectiviteId,
        indicateurId,
        indicateurValeurId: programmeValeur.id,
        typeScore: 'programme',
      },
      {
        actionId,
        collectiviteId,
        indicateurId,
        indicateurValeurId: faitValeur.id,
        typeScore: 'fait',
      },
    ])
    .onConflictDoNothing();
}

// ajoute les données nécessaires au calcul d'un score indicatif
export async function insertFixturePourScoreIndicatif(
  databaseService: DatabaseService,
  fixture: typeof fixturePourScoreIndicatif
) {
  const {
    collectiviteId,
    actionId,
    identifiantReferentiel,
    dateValeur,
    exprScore,
    objectif,
    resultat,
  } = fixture;

  const indicateurId = await getIndicateurIdByIdentifiant(
    databaseService,
    identifiantReferentiel
  );

  await prepareActionPourScoreIndicatif(databaseService, {
    actionId,
    indicateurId,
    exprScore,
  });

  const valeurs = await insertIndicateursValeurs(databaseService, {
    indicateurId,
    collectiviteId,
    dateValeur,
    objectif,
    resultat,
    deleteByDate: true,
  });

  await insertActionScoreIndicateurValeurs(databaseService, {
    actionId,
    collectiviteId,
    indicateurId,
    valeurs,
  });

  // Fonction de cleanup scopée à la collectivité uniquement.
  // On NE nettoie PAS `actionDefinitionTable.exprScore` ni le lien
  // `indicateurActionTable` : ces lignes sont globales et partagées entre
  // tests parallèles ; la formule est déterministe, les écritures
  // concurrentes convergent vers la même valeur. Nettoyer ici
  // déclencherait des races avec d'autres fichiers qui lisent la formule.
  return async () => {
    await databaseService.db
      .delete(indicateurValeurTable)
      .where(
        and(
          eq(indicateurValeurTable.indicateurId, indicateurId),
          eq(indicateurValeurTable.collectiviteId, collectiviteId),
          eq(indicateurValeurTable.dateValeur, dateValeur)
        )
      );
  };
}

/**
 * Identifiant stable de l'indicateur de test créé par insertFixtureScoreAvecExprCible.
 */
export const TEST_INDICATEUR_EXPR_CIBLE_IDENTIFIANT = 'test_ref_cible_cae';

/**
 * Crée un indicateur de test avec les données fournies,
 * lie cet indicateur à l'action, insère des valeurs et les associe au
 * calcul du score indicatif.
 *
 * L'indicateur de test a un identifiant stable (`test_ref_cible_cae`) afin
 * que la formule exprScore écrite sur l'action soit déterministe.
 * Le cleanup supprime intégralement l'indicateur de test (définition,
 * valeurs, liens action et score) pour laisser la DB dans son état initial.
 *
 * Cas d'usage : vérifier que `referentiel(id)` dans exprCible est évalué
 * en utilisant le contexte référentiel dérivé de l'actionId.
 */
export async function insertFixtureScoreAvecExprCible(
  databaseService: DatabaseService,
  options: {
    collectiviteId: number;
    actionId: string;
    exprCible: string;
    exprScore: string;
    dateValeur: string;
    resultat: number;
    objectif: number;
  }
): Promise<() => Promise<void>> {
  const {
    collectiviteId,
    actionId,
    exprCible,
    exprScore,
    dateValeur,
    resultat,
    objectif,
  } = options;
  const identifiantReferentiel = TEST_INDICATEUR_EXPR_CIBLE_IDENTIFIANT;

  // crée (ou met à jour) l'indicateur de test platform-level
  const [{ id: indicateurId }] = await databaseService.db
    .insert(indicateurDefinitionTable)
    .values({
      titre: 'Indicateur de test exprCible avec referentiel()',
      unite: '%',
      identifiantReferentiel,
      exprCible,
    })
    .onConflictDoUpdate({
      target: indicateurDefinitionTable.identifiantReferentiel,
      set: { exprCible },
    })
    .returning({ id: indicateurDefinitionTable.id });

  const previousExprScore = await databaseService.db
    .select({ exprScore: actionDefinitionTable.exprScore })
    .from(actionDefinitionTable)
    .where(eq(actionDefinitionTable.actionId, actionId))
    .then((rows) => rows[0]?.exprScore ?? null);

  await prepareActionPourScoreIndicatif(databaseService, {
    actionId,
    indicateurId,
    exprScore,
  });

  const valeurs = await insertIndicateursValeurs(databaseService, {
    indicateurId,
    collectiviteId,
    dateValeur,
    objectif,
    resultat,
    deleteByDate: false,
  });

  await insertActionScoreIndicateurValeurs(databaseService, {
    actionId,
    collectiviteId,
    indicateurId,
    valeurs,
  });

  return async () => {
    await databaseService.db
      .update(actionDefinitionTable)
      .set({ exprScore: previousExprScore })
      .where(eq(actionDefinitionTable.actionId, actionId));

    await databaseService.db
      .delete(actionScoreIndicateurValeurTable)
      .where(
        and(
          eq(actionScoreIndicateurValeurTable.collectiviteId, collectiviteId),
          eq(actionScoreIndicateurValeurTable.indicateurId, indicateurId)
        )
      );
    await databaseService.db
      .delete(indicateurValeurTable)
      .where(eq(indicateurValeurTable.indicateurId, indicateurId));
    await databaseService.db
      .delete(indicateurActionTable)
      .where(eq(indicateurActionTable.indicateurId, indicateurId));
    await databaseService.db
      .delete(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.id, indicateurId));
  };
}

/**
 * Identifiant stable de l'indicateur de test créé par
 * insertFixtureIndicateurPourValeursReference.
 */
export const TEST_INDICATEUR_VALEURS_REFERENCE_REFERENTIEL_IDENTIFIANT =
  'test_ref_default_te';

/**
 * Crée un indicateur plateforme avec une exprCible, pour tester
 * `indicateurs.valeurs.reference` sans contexte référentiel explicite.
 */
export async function insertFixtureIndicateurPourValeursReference(
  databaseService: DatabaseService,
  exprCible: string
): Promise<{ indicateurId: number; cleanup: () => Promise<void> }> {
  const identifiantReferentiel =
    TEST_INDICATEUR_VALEURS_REFERENCE_REFERENTIEL_IDENTIFIANT;

  const [{ id: indicateurId }] = await databaseService.db
    .insert(indicateurDefinitionTable)
    .values({
      titre: 'Indicateur de test valeurs de référence avec referentiel()',
      unite: '%',
      identifiantReferentiel,
      exprCible,
    })
    .onConflictDoUpdate({
      target: indicateurDefinitionTable.identifiantReferentiel,
      set: { exprCible },
    })
    .returning({ id: indicateurDefinitionTable.id });

  return {
    indicateurId,
    cleanup: async () => {
      await databaseService.db
        .delete(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, indicateurId));
    },
  };
}
