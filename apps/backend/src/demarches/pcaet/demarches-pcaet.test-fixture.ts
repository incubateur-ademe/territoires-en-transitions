import { INestApplication } from '@nestjs/common';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { randomUUID } from 'crypto';
import { eq, sql } from 'drizzle-orm';
import { demarcheDocumentTable } from '@tet/backend/demarches/shared/models/demarche-document.table';
import { demarcheDocumentSubstitutionTable } from '@tet/backend/demarches/shared/models/demarche-document-substitution.table';
import { demarchePlanActionTable } from '@tet/backend/demarches/shared/models/demarche-plan-action.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { CloreInstructionService } from './clore-instruction/clore-instruction.service';

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
 * Renseigne chaque ligne requise du diagnostic : un résultat sur l'année de
 * comptabilisation et un objectif sur le premier horizon du topic. Écrit
 * directement dans `indicateur_valeur`, là où vivent les valeurs de la
 * collectivité.
 */
export async function completeTestDiagnosticPcaet(
  db: DatabaseService,
  {
    collectiviteId,
    demarcheId,
    referenceYear = 2021,
  }: { collectiviteId: number; demarcheId: number; referenceYear?: number }
): Promise<void> {
  await db.db.execute(sql`
    insert into demarche_pcaet_diagnostic_state (demarche_id, topic_id, reference_year)
    select ${demarcheId}, id, ${referenceYear}
    from demarche_pcaet_topic
    where kind = 'indicateurs'
    on conflict (demarche_id, topic_id) do update set reference_year = ${referenceYear}
  `);

  await db.db.execute(sql`
    with ligne as (
        select d.id as indicateur_id, t.horizons[1] as horizon
        from demarche_pcaet_topic t
        join demarche_pcaet_topic_row r on r.topic_id = t.id
        join indicateur_definition d on d.identifiant_referentiel = r.referentiel_id
        where t.kind = 'indicateurs' and r.requis
    )
    insert into indicateur_valeur
        (indicateur_id, collectivite_id, date_valeur, metadonnee_id, resultat, objectif)
    select ligne.indicateur_id, ${collectiviteId}, annee.date_valeur, null,
           annee.resultat, annee.objectif
    from ligne
    cross join lateral (
        values (make_date(${referenceYear}, 1, 1), 100::double precision, null::double precision),
               (make_date(ligne.horizon, 1, 1), null, 80::double precision)
    ) as annee(date_valeur, resultat, objectif)
    on conflict do nothing
  `);
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
