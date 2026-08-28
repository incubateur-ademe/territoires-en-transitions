import { INestApplication } from '@nestjs/common';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { demarcheDocumentSubstitutionTable } from '@tet/backend/demarches/shared/models/demarche-document-substitution.table';
import { demarcheDocumentTable } from '@tet/backend/demarches/shared/models/demarche-document.table';
import { demarchePlanActionTable } from '@tet/backend/demarches/shared/models/demarche-plan-action.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { indicateurSourceMetadonneeTable } from '@tet/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceTable } from '@tet/backend/indicateurs/shared/models/indicateur-source.table';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { DatabaseServiceInterface } from '@tet/backend/utils/database/database-service.interface';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { CollectiviteType } from '@tet/domain/collectivites';
import {
  listPcaetDiagnosticIndicateurDefinitionIds,
  PCAET_DIAGNOSTIC_INDICATEURS,
  PCAET_DIAGNOSTIC_INDICATEURS_REQUIRED_OBJECTIF_YEARS,
  type PcaetDiagnosticIndicateurParentConfig,
} from '@tet/domain/demarches';
import { randomUUID } from 'crypto';
import { and, eq, inArray } from 'drizzle-orm';
import { CloreInstructionService } from './clore-instruction/clore-instruction.service';
import { demarchePcaetSourceMetadonneeTable } from './shared/models/demarche-pcaet-source-metadonnee.table';

/**
 * Une feuille `cae_*` par topic non optionnel : le guard exige désormais une
 * saisie sur chaque volet (filtrage par définition), pas une seule pour tous.
 */
const DIAGNOSTIC_COMPLETION_REFERENTIEL_IDS = (
  PCAET_DIAGNOSTIC_INDICATEURS as readonly PcaetDiagnosticIndicateurParentConfig[]
)
  .filter((topic) => topic.optional !== true)
  .map((topic) => {
    const ids = listPcaetDiagnosticIndicateurDefinitionIds(topic);
    return ids.find((id) => id.startsWith('cae_')) ?? ids[0];
  });

const PCAET_COLLECTIVITE_SOURCE_ID = 'pcaet-collectivite';
const PCAET_COLLECTIVITE_SOURCE_LABEL = 'PCAET collectivité';

/**
 * Un code de région libre, pour une collectivité instructrice de test : un index
 * unique interdit deux DREAL sur la même région, et un code en dur ferait échouer
 * la seconde exécution sur la collectivité laissée par la première. Deux lettres,
 * hors des codes réels qui sont numériques.
 *
 * Les codes pris sont lus avant de tirer, ce qui laisse une fenêtre de course
 * entre la lecture et l'insertion.
 */
export async function pickFreeRegionCode(
  { db }: DatabaseServiceInterface,
  type: CollectiviteType
): Promise<string> {
  const rows = await db
    .select({ regionCode: collectiviteTable.regionCode })
    .from(collectiviteTable)
    .where(eq(collectiviteTable.type, type));
  const pris = new Set(rows.map(({ regionCode }) => regionCode));

  const lettre = () => String.fromCharCode(65 + Math.floor(Math.random() * 26));
  for (let essai = 0; essai < 100; essai++) {
    const code = `${lettre()}${lettre()}`;
    if (!pris.has(code)) {
      return code;
    }
  }

  throw new Error(
    `Aucun code de région libre pour le type ${type} après 100 tirages ` +
      `(${pris.size} codes pris) — la base de test doit être nettoyée.`
  );
}

/**
 * Ajoute un fichier dans la bibliothèque de la collectivité, sans passer par le
 * stockage : le type reste inconnu côté `storage.objects`, ce que les règles du
 * dossier PCAET acceptent en se rabattant sur l'extension.
 */
export async function addTestBibliothequeFichier(
  db: DatabaseService,
  {
    collectiviteId,
    filename = 'dossier-pcaet.pdf',
  }: { collectiviteId: number; filename?: string }
): Promise<{ id: number; filename: string }> {
  const [fichier] = await db.db
    .insert(bibliothequeFichierTable)
    .values({
      collectiviteId,
      // La bibliothèque est dédupliquée par (collectivite, hash) : un hash
      // aléatoire garantit une nouvelle entrée à chaque appel.
      hash: randomUUID().replaceAll('-', ''),
      filename,
      confidentiel: false,
    })
    .returning({
      id: bibliothequeFichierTable.id,
      filename: bibliothequeFichierTable.filename,
    });

  return { id: fichier.id, filename: fichier.filename ?? filename };
}

/**
 * Identifiant de la pièce globale du modèle de démarche PCAET : son dépôt couvre
 * toutes les sections attendues.
 */
export const PCAET_DOCUMENT_GLOBAL_ID = 'pcaet_document_global';

/**
 * Rattache un plan au programme d'actions de la démarche — l'une des deux
 * conditions du guard `dossierComplet`. Appelable plusieurs fois : la démarche
 * en tient autant qu'on lui en rattache.
 */
export async function attachTestPlanToDemarchePcaet(
  db: DatabaseService,
  {
    collectiviteId,
    demarcheId,
    nom = 'Programme d’actions du PCAET',
  }: { collectiviteId: number; demarcheId: number; nom?: string }
): Promise<{ id: number }> {
  const [plan] = await db.db
    .insert(axeTable)
    .values({ nom, collectiviteId })
    .returning({ id: axeTable.id });

  await db.db
    .insert(demarchePlanActionTable)
    .values({ demarcheId, planActionId: plan.id });

  return plan;
}

/**
 * Couvre toutes les sections requises — l'autre condition du guard
 * `dossierComplet`. Le PCAET global déposé n'y suffit pas : plus aucune
 * couverture n'est implicite, chaque pièce qu'il contient porte sa déclaration
 * d'inclusion — celles que le dépôt coche d'office comme celles qui attendent
 * la collectivité. Écrit directement en base : c'est un raccourci de mise en
 * situation, pas un test du chemin de dépôt.
 */
export async function coverTestDocumentsPcaet(
  db: DatabaseService,
  {
    collectiviteId,
    demarcheId,
    userId,
  }: { collectiviteId: number; demarcheId: number; userId?: string }
): Promise<void> {
  const fichier = await addTestBibliothequeFichier(db, { collectiviteId });
  await db.db.insert(demarcheDocumentTable).values({
    collectiviteId,
    demarcheId,
    documentId: PCAET_DOCUMENT_GLOBAL_ID,
    etape: 'amont',
    fichierId: fichier.id,
    modifiedBy: userId ?? null,
  });

  // Une ligne sans fichier : c'est ainsi qu'une inclusion se déclare. Aucune
  // couverture n'étant implicite, toutes les pièces que le PCAET global peut
  // contenir y passent — celles qu'il coche d'office comme celles qui attendent
  // la déclaration.
  const declarables = await db.db
    .selectDistinct({
      documentId: demarcheDocumentSubstitutionTable.documentId,
    })
    .from(demarcheDocumentSubstitutionTable)
    .where(
      eq(
        demarcheDocumentSubstitutionTable.substitutId,
        PCAET_DOCUMENT_GLOBAL_ID
      )
    );

  if (declarables.length > 0) {
    await db.db.insert(demarcheDocumentTable).values(
      declarables.map(({ documentId }) => ({
        collectiviteId,
        demarcheId,
        documentId,
        // Une inclusion se déclare sur le dossier transmis.
        etape: 'amont' as const,
        modifiedBy: userId ?? null,
      }))
    );
  }
}

/**
 * Renseigne le diagnostic au sens du guard : un résultat sur l'année de
 * comptabilisation et un objectif sur chaque horizon requis. Écrit via la
 * source dédiée `pcaet-collectivite`.
 */
export async function completeTestDiagnosticPcaet(
  db: DatabaseService,
  {
    collectiviteId,
    demarcheId,
    referenceYear = 2021,
  }: { collectiviteId: number; demarcheId: number; referenceYear?: number }
): Promise<void> {
  const metadonneeId = await ensureTestPcaetMetadonneeId(db, {
    collectiviteId,
    demarcheId,
  });

  const definitions = await db.db
    .select({
      id: indicateurDefinitionTable.id,
      identifiantReferentiel: indicateurDefinitionTable.identifiantReferentiel,
    })
    .from(indicateurDefinitionTable)
    .where(
      inArray(
        indicateurDefinitionTable.identifiantReferentiel,
        DIAGNOSTIC_COMPLETION_REFERENTIEL_IDS
      )
    );

  const definitionByReferentiel = new Map(
    definitions.map((definition) => [
      definition.identifiantReferentiel,
      definition.id,
    ])
  );

  const missing = DIAGNOSTIC_COMPLETION_REFERENTIEL_IDS.filter(
    (id) => !definitionByReferentiel.has(id)
  );
  if (missing.length > 0) {
    throw new Error(
      `Indicateurs absents du référentiel pour saturer le diagnostic : ${missing.join(', ')}`
    );
  }

  await db.db
    .insert(indicateurValeurTable)
    .values(
      DIAGNOSTIC_COMPLETION_REFERENTIEL_IDS.flatMap((referentielId) => {
        const indicateurId = definitionByReferentiel.get(referentielId);
        if (indicateurId === undefined) {
          throw new Error(
            `Indicateur ${referentielId} absent du référentiel pour saturer le diagnostic`
          );
        }
        return [
          {
            indicateurId,
            collectiviteId,
            dateValeur: `${referenceYear}-01-01`,
            metadonneeId,
            resultat: 100,
            objectif: null,
          },
          ...PCAET_DIAGNOSTIC_INDICATEURS_REQUIRED_OBJECTIF_YEARS.map(
            (year) => ({
              indicateurId,
              collectiviteId,
              dateValeur: `${year}-01-01`,
              metadonneeId,
              resultat: null,
              objectif: 80,
            })
          ),
        ];
      })
    )
    .onConflictDoNothing();
}

/** Métadonnée `pcaet-collectivite` pour une démarche de test. */
export async function ensureTestPcaetMetadonneeId(
  db: DatabaseService,
  { collectiviteId, demarcheId }: { collectiviteId: number; demarcheId: number }
): Promise<number> {
  await db.db
    .insert(indicateurSourceTable)
    .values({
      id: PCAET_COLLECTIVITE_SOURCE_ID,
      libelle: PCAET_COLLECTIVITE_SOURCE_LABEL,
      ordreAffichage: null,
    })
    .onConflictDoUpdate({
      target: indicateurSourceTable.id,
      set: { libelle: PCAET_COLLECTIVITE_SOURCE_LABEL },
    });

  const [existingLink] = await db.db
    .select({ metadonneeId: demarchePcaetSourceMetadonneeTable.metadonneeId })
    .from(demarchePcaetSourceMetadonneeTable)
    .where(
      and(
        eq(demarchePcaetSourceMetadonneeTable.demarcheId, demarcheId),
        eq(demarchePcaetSourceMetadonneeTable.collectiviteId, collectiviteId)
      )
    )
    .limit(1);

  if (existingLink?.metadonneeId !== undefined) {
    return existingLink.metadonneeId;
  }

  const [metadonnee] = await db.db
    .insert(indicateurSourceMetadonneeTable)
    .values({
      sourceId: PCAET_COLLECTIVITE_SOURCE_ID,
      dateVersion: new Date().toISOString(),
      nomDonnees: null,
      diffuseur: null,
      producteur: null,
      methodologie: null,
      limites: null,
    })
    .returning({ id: indicateurSourceMetadonneeTable.id });

  await db.db
    .insert(demarchePcaetSourceMetadonneeTable)
    .values({
      demarcheId,
      collectiviteId,
      metadonneeId: metadonnee.id,
    })
    .onConflictDoNothing();

  return metadonnee.id;
}

/**
 * Rend le dossier complet au sens du guard `dossierComplet` : programme
 * d'actions rattaché, pièces requises couvertes et diagnostic renseigné. Les
 * composer séparément permet de tester chacune. La vulnérabilité du territoire
 * n'en fait pas partie : aucune de ses saisies n'est obligatoire.
 */
export async function completeTestDossierPcaet(
  db: DatabaseService,
  options: { collectiviteId: number; demarcheId: number; userId?: string }
): Promise<void> {
  await attachTestPlanToDemarchePcaet(db, options);
  await coverTestDocumentsPcaet(db, options);
  await completeTestDiagnosticPcaet(db, options);
}

/**
 * Antidate l'échéance d'avis d'un dossier transmis, puis fait constater sa
 * clôture par le système — le chemin « délai échu ».
 *
 * Remplace le couple « antidater + adopter » des tests d'avant la fusion :
 * l'adoption n'est plus une transition, et la bascule en `instruit` n'est
 * l'acte de personne. Passe par le service pour exercer le vrai chemin, guards
 * compris, plutôt que d'écrire le statut à la main.
 */
export async function cloreTestInstructionPcaet(
  app: INestApplication,
  db: DatabaseService,
  { collectiviteId, demarcheId }: { collectiviteId: number; demarcheId: number }
): Promise<void> {
  await db.db
    .update(demarcheTable)
    .set({
      avisDeadlineAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    })
    .where(eq(demarcheTable.id, demarcheId));

  const result = await app
    .get(CloreInstructionService)
    .clore({ collectiviteId, demarcheId });

  if (!result.success) {
    throw new Error(
      `Clôture d'instruction impossible sur la démarche ${demarcheId} : ${result.error}`
    );
  }
  if (!result.data) {
    throw new Error(
      `Clôture d'instruction sans effet sur la démarche ${demarcheId} : aucune condition réunie`
    );
  }
}

/**
 * Mène un dossier transmis jusqu'à la publication : clôture de l'instruction,
 * dépôt de la délibération d'adoption, puis publication.
 *
 * Utile aux tests qui ont besoin d'un dossier **terminé** — un dossier
 * seulement instruit reste « en cours » et bloque la création d'un nouveau
 * dépôt.
 */
export async function publierTestDemarchePcaet(
  app: INestApplication,
  db: DatabaseService,
  caller: {
    demarches: {
      pcaet: {
        documents: {
          add: (input: {
            collectiviteId: number;
            demarcheId: number;
            documentId: string;
            fichierId: number;
          }) => Promise<unknown>;
        };
        publier: (input: {
          collectiviteId: number;
          demarcheId: number;
        }) => Promise<unknown>;
      };
    };
  },
  { collectiviteId, demarcheId }: { collectiviteId: number; demarcheId: number }
): Promise<void> {
  await cloreTestInstructionPcaet(app, db, { collectiviteId, demarcheId });

  const deliberation = await addTestBibliothequeFichier(db, {
    collectiviteId,
    filename: 'deliberation-adoption.pdf',
  });
  await caller.demarches.pcaet.documents.add({
    collectiviteId,
    demarcheId,
    documentId: 'pcaet_deliberation_adoption',
    fichierId: deliberation.id,
  });

  await caller.demarches.pcaet.publier({ collectiviteId, demarcheId });
}
